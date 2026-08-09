import { Redis } from '@upstash/redis';
import { newsDateString, redisKeyForDate } from '../src/lib/date';
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

async function main() {
  const date = newsDateString();
  console.log(`[pipeline] día de noticias (ET): ${date}${DRY_RUN ? ' (dry-run)' : ''}`);

  const items = await collectItems(date);
  console.log(`[pipeline] total items del día: ${items.length}`);

  if (DRY_RUN) {
    for (const i of items) {
      console.log(`  #${i.index} [${i.source}] ${i.title} — ${i.publishedAt}`);
    }
    return;
  }

  if (items.length === 0) {
    throw new Error('No hay items del día; se aborta sin llamar a Gemini');
  }

  const result = await summarizeWithGemini(items);
  console.log(
    `[gemini] OK modelo=${result.model} historias=${result.stories.length} ` +
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
    console.log('[redis] --skip-write: registro no guardado. Vista previa:');
    console.log(JSON.stringify(record, null, 2).slice(0, 4000));
    return;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Faltan credenciales de Upstash');

  const redis = new Redis({ url, token });
  const key = redisKeyForDate(date);
  // DEL previo: JSON.SET falla con WRONGTYPE si la clave existía como string plano
  const tx = redis.multi();
  tx.del(key);
  tx.json.set(key, '$', record as unknown as Record<string, unknown>);
  await tx.exec();
  console.log(`[redis] guardado ${key} como JSON (sin expiración)`);
}

main().catch((err) => {
  console.error(`[pipeline] ERROR: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
