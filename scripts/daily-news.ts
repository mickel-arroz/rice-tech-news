import { Redis } from '@upstash/redis';
import {
  latestPublishableDate,
  publishableDates,
  rawKeyForDate,
  redisKeyForDate,
} from '../src/lib/date';
import type {
  DayRecord,
  Lang,
  LocalizedDay,
  LocalizedStory,
  StorySource,
} from '../src/lib/types';
import {
  capHackerNews,
  mergeByUrl,
  RAW_RETENTION_DAYS,
  shouldKeepStored,
  shouldRepairGap,
} from './digest-rules';
import { summarizeWithGemini, type GeminiStory } from './gemini';
import type { SourceItem } from './sources/base';
import { createAllSources } from './sources/factory';
import type { RawItem } from './types';

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_WRITE = process.argv.includes('--skip-write');
// Permite rehacer un día aunque el guardado tenga más items (p.ej. tras cambiar el prompt).
const FORCE = process.argv.includes('--force');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Un día objetivo con menos items que esto significa que el recolector no corrió: mejor fallar
// ruidosamente que publicar un día pobre en silencio, que es lo que venía pasando.
const MIN_ITEMS_TARGET = 10;

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

/** Items ya guardados por el recolector para ese día. */
async function loadRawItems(redis: Redis, date: string): Promise<SourceItem[]> {
  // hvals está tipado como Promise<any> en el SDK; el JSON se valida al parsear.
  const values = (await redis.hvals(rawKeyForDate(date))) as (string | SourceItem)[] | null;
  const items: SourceItem[] = [];
  for (const value of values ?? []) {
    try {
      // El SDK deserializa JSON automáticamente cuando puede; toleramos ambas formas.
      items.push(typeof value === 'string' ? (JSON.parse(value) as SourceItem) : value);
    } catch {
      // Un campo corrupto no debe tumbar el día entero.
    }
  }
  return items;
}

/** Lo que los feeds exponen ahora mismo para ese día (poco, si el día ya cerró). */
async function fetchLiveItems(date: string): Promise<SourceItem[]> {
  const sources = createAllSources();
  const results = await Promise.allSettled(sources.map((s) => s.fetchItems(date)));
  const items: SourceItem[] = [];
  let okCount = 0;

  results.forEach((result, i) => {
    const name = sources[i].name;
    if (result.status === 'fulfilled') {
      okCount++;
      console.log(`[fetch] ${name}: ${result.value.length} items (${date})`);
      items.push(...result.value);
    } else {
      console.error(`[fetch] ${name} FALLÓ: ${String(result.reason).slice(0, 200)}`);
    }
  });

  if (okCount === 0) throw new Error('Todas las fuentes fallaron');
  return items;
}

/** Junta raw + feeds para un día y deja los items listos para Gemini (ordenados e indexados). */
async function collectItems(date: string, redis: Redis | null): Promise<RawItem[]> {
  const raw = redis ? await loadRawItems(redis, date) : [];
  console.log(`[raw] ${rawKeyForDate(date)}: ${raw.length} items acumulados`);

  const merged = mergeByUrl(raw, await fetchLiveItems(date));
  console.log(`[pipeline] ${date}: ${raw.length} de raw + ${merged.length - raw.length} del feed`);

  const capped = capHackerNews(merged);
  if (capped.length !== merged.length) {
    console.log(`[pipeline] Hacker News recortado: ${merged.length} → ${capped.length} items`);
  }
  capped.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return capped.map((item, index) => ({ ...item, index }));
}

/**
 * Cuántos items tenía el registro ya guardado (0 si no existe).
 *
 * Si la clave quedara como string plano —el caso que el DEL previo al JSON.SET ya anticipa—
 * JSON.GET responde WRONGTYPE. Se trata como "no hay nada guardado" en vez de tumbar la corrida:
 * el camino normal sigue y el DEL + JSON.SET del final repara la clave.
 */
async function storedCollected(redis: Redis, date: string): Promise<number> {
  try {
    const value = await redis.json.get<number[]>(redisKeyForDate(date), '$.stats.collected');
    return Array.isArray(value) ? Number(value[0] ?? 0) : 0;
  } catch (err) {
    console.warn(
      `[redis] no se pudo leer ${redisKeyForDate(date)}: ${String((err as Error)?.message ?? err)}` +
        '; se trata como día no guardado',
    );
    return 0;
  }
}

function slugify(title: string, used: Set<string>): string {
  const base = title
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

type DayOutcome = 'ok' | 'empty' | 'preview' | 'kept';

/**
 * Procesa UN día. 'empty' y 'kept' se omiten sin abortar.
 *
 * Las dos opciones distinguen la corrida automática de un `--date=` pedido a mano:
 * - `enforceMinItems`: un día pedido a mano puede traer legítimamente pocos items (los feeds ya
 *   no alcanzan días viejos) y no debe fallar por ello.
 * - `automatic`: activa la comparación `>=` de `shouldKeepStored`, para que los reintentos del
 *   cron de cada 6 h salgan sin gastar otra llamada a Gemini.
 */
async function processDay(
  date: string,
  redis: Redis | null,
  { enforceMinItems, automatic }: { enforceMinItems: boolean; automatic: boolean },
): Promise<DayOutcome> {
  const items = await collectItems(date, redis);
  console.log(`[pipeline] ${date}: ${items.length} items a resumir`);

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

  // Antes de gastar una llamada a Gemini: no degradar un día que ya está mejor guardado, y en la
  // corrida automática tampoco rehacer uno que ya está igual de completo (el cron reintenta cada
  // 6 h y el segundo intento no debe volver a pagar a Gemini).
  if (redis && !SKIP_WRITE) {
    const previous = await storedCollected(redis, date);
    if (shouldKeepStored(previous, items.length, FORCE, automatic)) {
      console.log(
        `[pipeline] ${date}: ya publicado con ${previous} items (ahora hay ${items.length}); ` +
          'no se sobrescribe ni se llama a Gemini (usa --force para forzar)',
      );
      return 'kept';
    }
  }

  if (enforceMinItems && items.length < MIN_ITEMS_TARGET) {
    throw new Error(
      `${date}: solo ${items.length} items (mínimo ${MIN_ITEMS_TARGET}). ` +
        '¿Corrió el recolector? Revisa el workflow "Collect raw news".',
    );
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

/**
 * Rellena UN hueco: el día publicable más reciente que no tiene ningún registro pero cuyo bucket
 * `raw:` todavía da para reconstruirlo.
 *
 * Uno por corrida a propósito. Hay 4 corridas al día, así que un hueco se cierra el mismo día y
 * el tiempo de cada corrida sigue acotado (una llamada a Gemini tarda, y el job tiene 30 min).
 *
 * Nunca puede degradar nada: solo mira fechas sin registro (`shouldRepairGap` exige `stored === 0`)
 * y `processDay` vuelve a pasar por `shouldKeepStored` antes de escribir. Y nunca puede tumbar la
 * corrida: el día objetivo ya se resolvió, así que un fallo aquí solo se avisa.
 */
async function repairOneGap(redis: Redis, targetDate: string): Promise<void> {
  for (const date of publishableDates(RAW_RETENTION_DAYS)) {
    if (date === targetDate) continue;
    const stored = await storedCollected(redis, date);
    const rawCount = await redis.hlen(rawKeyForDate(date));
    if (!shouldRepairGap(stored, rawCount, MIN_ITEMS_TARGET)) continue;

    console.log(`[pipeline] hueco detectado: ${date} sin registro y ${rawCount} items en raw`);
    try {
      // enforceMinItems: false — el filtro real ya lo hizo shouldRepairGap sobre el bucket raw,
      // y los feeds vivos no alcanzan un día viejo, así que el mínimo no aplica aquí.
      const outcome = await processDay(date, redis, { enforceMinItems: false, automatic: true });
      // 'empty' = el bucket tenía entradas pero ninguna utilizable. Ese día no se va a poder
      // rellenar nunca, así que no puede quedarse acaparando el único intento de cada corrida:
      // se sigue con el hueco siguiente en vez de bloquear los demás para siempre.
      if (outcome === 'empty') continue;
    } catch (err) {
      // Un fallo aquí (p.ej. toda la cadena saturada) no se reintenta con otro día: el día
      // objetivo ya está resuelto y no vale la pena quemar más cuota en la misma corrida.
      console.warn(
        `[pipeline] no se pudo rellenar ${date}: ${String((err as Error)?.message ?? err)}`,
      );
    }
    return;
  }
  console.log('[pipeline] sin huecos que rellenar en la ventana de raw');
}

async function main() {
  const explicit = explicitDate();
  // Siempre "ayer" en ET: el día ya cerró, así que sus fuentes están completas. Se calcula desde
  // la FECHA ET, no restando horas, para que el retraso del cron de GitHub no mueva el objetivo.
  const targetDate = explicit ?? latestPublishableDate();

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!DRY_RUN && !SKIP_WRITE && (!url || !token)) {
    throw new Error('Faltan credenciales de Upstash');
  }
  const redis = url && token ? new Redis({ url, token }) : null;

  const label = explicit ? 'día pedido' : 'día objetivo (ayer en ET)';
  console.log(`[pipeline] ${label}: ${targetDate}${DRY_RUN ? ' (dry-run)' : ''}`);

  // El pipeline nunca REESCRIBE por su cuenta un día ya publicado: rehacer uno es una decisión
  // manual y explícita (`--date=YYYY-MM-DD [--force]`). Lo único que hace solo es rellenar huecos
  // totales, fechas sin ningún registro — ahí no hay nada que pisar.
  try {
    await processDay(targetDate, redis, { enforceMinItems: !explicit, automatic: !explicit });
  } catch (err) {
    console.error(
      `[pipeline] ${targetDate} ERROR: ${err instanceof Error ? err.stack : String(err)}`,
    );
    process.exit(1);
  }

  // Solo en la corrida automática: un `--date=` pedido a mano sigue siendo un día y nada más.
  if (redis && !explicit && !DRY_RUN && !SKIP_WRITE) {
    await repairOneGap(redis, targetDate);
  }
}

main().catch((err) => {
  console.error(`[pipeline] ERROR: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
