import { Redis } from '@upstash/redis';
import { lastNDates, newsDateString, redisKeyForDate } from '../src/lib/date';
import type {
  DayRecord,
  Lang,
  LocalizedDay,
  LocalizedStory,
  StorySource,
} from '../src/lib/types';
import { summarizeWithGemini, type GeminiStory } from './gemini';
import { createAllSources } from './sources/factory';
import type { RawItem } from './types';

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_WRITE = process.argv.includes('--skip-write');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Si el cron de GitHub se retrasa y cruza la medianoche ET, seguimos apuntando al día que acaba
// de terminar en vez del día nuevo aún vacío.
const GRACE_MS = 3 * 3_600_000;
const WINDOW_DAYS = 7;

// --date=YYYY-MM-DD (o env NEWS_DATE) fuerza un día; null = corrida normal.
function explicitDate(): string | null {
  const arg = process.argv.find((a) => a.startsWith('--date='))?.slice('--date='.length);
  const explicit = arg ?? process.env.NEWS_DATE;
  if (!explicit) return null;
  if (!DATE_RE.test(explicit)) {
    throw new Error(`Fecha inválida: "${explicit}" (formato esperado YYYY-MM-DD)`);
  }
  return explicit;
}

// Huecos dentro de la ventana anclados por datos más antiguos (existen 08-08 y 08-10 pero falta
// 08-09). Excluye el borde viejo sin datos: esos días las fuentes ya no los proveen.
async function findIntermediateGaps(
  redis: Redis,
  from: Date,
  targetDate: string,
): Promise<string[]> {
  const window = lastNDates(WINDOW_DAYS, from);
  const values = await redis.json.mget<unknown[]>(window.map(redisKeyForDate), '$.date');
  const present = new Set(
    window.filter((_, i) => Array.isArray(values[i]) && (values[i] as unknown[]).length > 0),
  );
  const oldestPresent = [...present].sort()[0];
  if (!oldestPresent) return [];
  return window.filter((d) => !present.has(d) && d > oldestPresent && d < targetDate);
}

async function collectItems(newsDate: string): Promise<RawItem[]> {
  const sources = createAllSources();
  const results = await Promise.allSettled(sources.map((s) => s.fetchItems(newsDate)));
  const items: Omit<RawItem, 'index'>[] = [];
  let okCount = 0;

  results.forEach((result, i) => {
    const name = sources[i].name;
    if (result.status === 'fulfilled') {
      okCount++;
      console.log(`[fetch] ${name}: ${result.value.length} items (${newsDate})`);
      items.push(...result.value);
    } else {
      console.error(`[fetch] ${name} FALLÓ: ${String(result.reason).slice(0, 200)}`);
    }
  });

  if (okCount === 0) {
    throw new Error('Todas las fuentes fallaron');
  }

  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return items.map((item, index) => ({ ...item, index }));
}

function slugify(title: string, used: Set<string>): string {
  let base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'story';
  let slug = base;
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  used.add(slug);
  return slug;
}

// Cada idioma queda como rama autocontenida para poder leer solo una con JSON.GET $.<lang>
function buildLocalizedDays(
  summary: { es: string; en: string },
  geminiStories: GeminiStory[],
  items: RawItem[],
): Record<Lang, LocalizedDay> {
  const used = new Set<string>();
  const stories: Record<Lang, LocalizedStory[]> = { es: [], en: [] };

  for (const gs of geminiStories) {
    const sources: StorySource[] = gs.sourceIndexes.map((i) => {
      const item = items[i];
      return {
        name: item.source,
        url: item.url,
        title: item.title,
        ...(item.points !== undefined && { points: item.points }),
        ...(item.comments !== undefined && { comments: item.comments }),
      };
    });
    const publishedAt = gs.sourceIndexes.map((i) => items[i].publishedAt).sort()[0];
    const id = slugify(gs.title.en, used);

    for (const lang of ['es', 'en'] as const) {
      stories[lang].push({
        id,
        title: gs.title[lang],
        shortSummary: gs.shortSummary[lang],
        longSummary: gs.longSummary[lang],
        tags: gs.tags[lang],
        sources,
        publishedAt,
      });
    }
  }

  return {
    es: { summary: summary.es, stories: stories.es },
    en: { summary: summary.en, stories: stories.en },
  };
}

// Procesa UN día. 'empty' (sin items, típico en backfill de días viejos) se omite sin abortar.
async function processDay(date: string, redis: Redis | null): Promise<'ok' | 'empty' | 'preview'> {
  const items = await collectItems(date);
  console.log(`[pipeline] ${date}: ${items.length} items`);

  if (DRY_RUN) {
    for (const i of items) {
      console.log(`  #${i.index} [${i.source}] ${i.title} — ${i.publishedAt}`);
    }
    return 'preview';
  }

  if (items.length === 0) {
    console.warn(`[pipeline] ${date}: sin items; se omite (no se llama a Gemini)`);
    return 'empty';
  }

  const result = await summarizeWithGemini(items);
  console.log(
    `[gemini] ${date} OK modelo=${result.model} historias=${result.stories.length} ` +
      `(de ${items.length} items)`,
  );

  const record: DayRecord = {
    date,
    generatedAt: new Date().toISOString(),
    model: result.model,
    stats: { collected: items.length, stories: result.stories.length },
    ...buildLocalizedDays(result.summary, result.stories, items),
  };

  if (SKIP_WRITE) {
    console.log(`[redis] --skip-write: ${date} no guardado. Vista previa:`);
    console.log(JSON.stringify(record, null, 2).slice(0, 4000));
    return 'preview';
  }

  if (!redis) throw new Error('Faltan credenciales de Upstash');
  const key = redisKeyForDate(date);
  // DEL previo: JSON.SET falla con WRONGTYPE si la clave existía como string plano
  const tx = redis.multi();
  tx.del(key);
  tx.json.set(key, '$', record as unknown as Record<string, unknown>);
  await tx.exec();
  console.log(`[redis] guardado ${key} como JSON (sin expiración)`);
  return 'ok';
}

async function main() {
  const explicit = explicitDate();
  const now = new Date(Date.now() - GRACE_MS);
  const targetDate = explicit ?? newsDateString(now);

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!DRY_RUN && !SKIP_WRITE && (!url || !token)) {
    throw new Error('Faltan credenciales de Upstash');
  }
  const redis = url && token ? new Redis({ url, token }) : null;

  // Con --date solo ese día. En corrida normal: día actual + huecos intermedios de la ventana,
  // el actual primero y los huecos de más reciente a más antiguo.
  let dates = [targetDate];
  if (!explicit && !DRY_RUN && !SKIP_WRITE && redis) {
    const gaps = (await findIntermediateGaps(redis, now, targetDate)).sort().reverse();
    if (gaps.length > 0) {
      console.log(`[pipeline] días intermedios faltantes a rellenar: ${gaps.join(', ')}`);
    }
    dates = [targetDate, ...gaps];
  }

  console.log(`[pipeline] día actual (ET): ${targetDate}${DRY_RUN ? ' (dry-run)' : ''}`);

  // El día actual es obligatorio (si falla → exit 1); los backfills son best-effort.
  let targetFailed = false;
  for (const date of dates) {
    try {
      await processDay(date, redis);
    } catch (err) {
      const detail = err instanceof Error ? err.stack : String(err);
      if (date === targetDate) {
        console.error(`[pipeline] ${date} (día actual) ERROR: ${detail}`);
        targetFailed = true;
      } else {
        console.warn(`[pipeline] ${date} (backfill) falló, se continúa: ${detail}`);
      }
    }
  }

  if (targetFailed) process.exit(1);
}

main().catch((err) => {
  console.error(`[pipeline] ERROR: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
