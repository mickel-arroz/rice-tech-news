import { Redis } from '@upstash/redis';
import { newsDateString, rawKeyForDate } from '../src/lib/date';
import { RAW_RETENTION_DAYS } from './digest-rules';
import type { SourceItem } from './sources/base';
import { createAllSources } from './sources/factory';

const DRY_RUN = process.argv.includes('--dry-run');

// Los buckets viven bastante más que la ventana visible del sitio (LOOKBACK_DAYS = 21) no hace
// falta: solo se necesitan mientras el día pueda regenerarse. Los días salen de digest-rules
// porque el digest usa la misma ventana para decidir qué huecos todavía puede reconstruir.
const RAW_TTL_SECONDS = RAW_RETENTION_DAYS * 86_400;

/**
 * Recolector. Corre cada hora y ACUMULA; no resume nada y nunca toca las claves `news:*`.
 *
 * Existe porque los feeds son ventanas cortas: The Verge expone 10 items (~5 h), TechCrunch 20
 * (~24 h), Ars 20 (~33 h). Una sola pasada al día no puede ver un día completo — a las 04:00 ET
 * los artículos de ayer de The Verge ya se cayeron del feed. Pasando seguido y guardando, el día
 * queda completo cuando cierra.
 *
 * Cada item se archiva en el bucket de SU PROPIA fecha de publicación (ET), no de la hora en que
 * corrimos: un artículo de las 23:50 ET del día 3 recolectado a las 00:20 ET del día 4 cae en
 * `raw:<día 3>`, donde le corresponde.
 */
async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!DRY_RUN && (!url || !token)) throw new Error('Faltan credenciales de Upstash');
  const redis = url && token ? new Redis({ url, token }) : null;

  const sources = createAllSources();
  const results = await Promise.allSettled(sources.map((s) => s.fetchAll()));

  const byDate = new Map<string, SourceItem[]>();
  let okCount = 0;

  results.forEach((result, i) => {
    const name = sources[i].name;
    if (result.status !== 'fulfilled') {
      console.error(`[collect] ${name} FALLÓ: ${String(result.reason).slice(0, 200)}`);
      return;
    }
    okCount++;
    console.log(`[collect] ${name}: ${result.value.length} items en el feed`);
    for (const item of result.value) {
      const date = newsDateString(new Date(item.publishedAt));
      const bucket = byDate.get(date);
      if (bucket) bucket.push(item);
      else byDate.set(date, [item]);
    }
  });

  // Tolera fallos parciales igual que el pipeline; aborta solo si no quedó ninguna fuente.
  if (okCount === 0) throw new Error('Todas las fuentes fallaron');

  const dates = [...byDate.keys()].sort().reverse();

  for (const date of dates) {
    const items = byDate.get(date)!;
    const key = rawKeyForDate(date);

    if (DRY_RUN || !redis) {
      console.log(`[collect] --dry-run: ${key} recibiría ${items.length} items`);
      continue;
    }

    // Campo = URL del item: recolectar dos veces el mismo artículo no lo duplica, y la pasada
    // más reciente refresca puntos y comentarios (en HN suben con las horas).
    const fields = Object.fromEntries(items.map((item) => [item.url, JSON.stringify(item)]));
    const tx = redis.multi();
    tx.hset(key, fields);
    tx.expire(key, RAW_TTL_SECONDS);
    await tx.exec();

    const total = await redis.hlen(key);
    console.log(`[collect] ${key}: ${items.length} vistos → ${total} únicos acumulados`);
  }

  console.log(`[collect] listo: ${okCount}/${sources.length} fuentes, ${dates.length} días tocados`);
}

main().catch((err) => {
  console.error(`[collect] ERROR: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
