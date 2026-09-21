import type { SourceItem } from './sources/base';

// Reglas puras del digest, sin I/O, para poder probarlas sin ejecutar el pipeline.

// Un día completo trae ~110 items y HN aporta la mayoría. Sin tope, la salida bilingüe de
// Gemini se acerca al límite de 65536 tokens y arriesga truncarse (→ JSON inválido). Se recortan
// las historias de HN con menos puntos, que es la señal de notoriedad que la fuente ya provee.
export const MAX_HN_ITEMS = 50;

/**
 * Días que sobrevive un bucket `raw:`. Es la ventana en la que un día todavía se puede
 * reconstruir: pasado eso no quedan datos crudos con los que rehacerlo. El recolector deriva
 * su TTL de aquí para que las dos mitades no se desincronicen.
 */
export const RAW_RETENTION_DAYS = 10;

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
 *
 * `automatic` (la corrida sin `--date=`) compara con `>=` en vez de `>`: el digest corre cada 6 h
 * y el día objetivo ya cerró, así que su cantidad de items está congelada; el primer intento que
 * publica gana y los siguientes salen gratis, sin gastar otra llamada a Gemini.
 *
 * Deliberadamente NO es "la clave existe → saltar". Las corridas de `schedule` de GitHub llegan
 * tarde (se han visto 5-12 h), y una lo bastante retrasada cruza medianoche ET y publicaría el
 * día recién cerrado casi sin pasadas del recolector encima. Comparando cantidades, el intento
 * siguiente —que sí ve más items— todavía puede mejorarlo; con un chequeo de existencia quedaría
 * congelado flaco, que es justo la degradación que esta función existe para impedir.
 */
export function shouldKeepStored(
  previous: number,
  incoming: number,
  force = false,
  automatic = false,
): boolean {
  if (force) return false;
  return automatic ? previous >= incoming : previous > incoming;
}

/**
 * ¿Hay que reconstruir este día como hueco? Solo cuando NO existe ningún registro y su bucket
 * `raw:` todavía tiene material suficiente.
 *
 * Es la contrapartida de `shouldKeepStored`: esa impide degradar un día que existe, y esta
 * rellena uno que no existe. Al exigir `stored === 0` no puede pisar nada — no hay nada que
 * pisar — así que las dos reglas no pueden entrar en conflicto.
 *
 * Existe porque los 4 intentos de un día pueden fallar los cuatro (una saturación larga de
 * Gemini) y entonces ese día no se publicaba nunca, aunque sus datos crudos siguieran sanos
 * 10 días. Así se perdieron 2026-09-13, -14 y -15.
 */
export function shouldRepairGap(stored: number, rawCount: number, minItems: number): boolean {
  return stored === 0 && rawCount >= minItems;
}
