import type { SourceItem } from './sources/base';

// Reglas puras del digest, sin I/O, para poder probarlas sin ejecutar el pipeline.

// Un día completo trae ~110 items y HN aporta la mayoría. Sin tope, la salida bilingüe de
// Gemini se acerca al límite de 65536 tokens y arriesga truncarse (→ JSON inválido). Se recortan
// las historias de HN con menos puntos, que es la señal de notoriedad que la fuente ya provee.
export const MAX_HN_ITEMS = 50;

/** Recorta las historias de HN con menos puntos, dejando intactas las demás fuentes. */
export function capHackerNews(items: SourceItem[], max = MAX_HN_ITEMS): SourceItem[] {
  const hn = items.filter((i) => i.source === 'Hacker News');
  if (hn.length <= max) return items;

  const kept = new Set(
    [...hn]
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
      .slice(0, max)
      .map((i) => i.url),
  );
  return items.filter((i) => i.source !== 'Hacker News' || kept.has(i.url));
}

/**
 * Une lo acumulado por el recolector con lo que los feeds muestran ahora, deduplicando por URL.
 * `raw` manda: es la única fuente que puede tener el día completo. El fetch en vivo se conserva
 * como red de seguridad — si el recolector no corrió, el pipeline sigue produciendo algo.
 */
export function mergeByUrl(raw: SourceItem[], live: SourceItem[]): SourceItem[] {
  const byUrl = new Map<string, SourceItem>();
  for (const item of raw) byUrl.set(item.url, item);
  for (const item of live) if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  return [...byUrl.values()];
}

/**
 * ¿Hay que preservar el día ya guardado en vez de sobrescribirlo? Se comprueba ANTES de llamar
 * a Gemini, así una corrida pobre no gasta cuota ni degrada un día bueno. Esta es la regla que
 * impide que se repita la caída progresiva de 21 historias a 1.
 */
export function shouldKeepStored(previous: number, incoming: number, force = false): boolean {
  if (force) return false;
  return previous > incoming;
}
