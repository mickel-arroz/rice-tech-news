import {
  lastNDates,
  latestPublishableDate,
  newsDateString,
  previousDate,
  publishableDates,
  rawKeyForDate,
  redisKeyForDate,
} from '../src/lib/date';
import { capHackerNews, mergeByUrl, shouldKeepStored } from './digest-rules';
import type { SourceItem } from './sources/base';

// Pruebas de las reglas puras: fechas y decisiones del digest. Sin red ni Redis.
// Ejecutar con `npm run selftest`.

let failed = 0;

function eq(label: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  const detail = ok ? '' : ` → obtenido ${JSON.stringify(got)}, esperado ${JSON.stringify(want)}`;
  console.log(`${ok ? 'ok  ' : 'FALLA'} ${label}${detail}`);
}

function section(title: string): void {
  console.log(`\n— ${title}`);
}

// ---------------------------------------------------------------- fechas

section('previousDate: aritmética de calendario');
eq('cruce de mes', previousDate('2026-09-01'), '2026-08-31');
eq('cruce de año', previousDate('2026-01-01'), '2025-12-31');
eq('año bisiesto', previousDate('2028-03-01'), '2028-02-29');

section('latestPublishableDate: siempre ayer, inmune a la hora');
// 2026-09-04 en ET va de 04:00Z del 04 a 03:59Z del 05: todas esas horas son el mismo día ET.
const mismoDiaET = [
  '2026-09-04T04:00:00Z',
  '2026-09-04T08:47:00Z',
  '2026-09-04T12:00:00Z',
  '2026-09-04T23:59:00Z',
  '2026-09-05T03:59:00Z',
].map((iso) => latestPublishableDate(new Date(iso)));
eq('todo el día ET da el mismo objetivo', mismoDiaET, Array(5).fill('2026-09-03'));
eq('al cerrar el día ET avanza uno', latestPublishableDate(new Date('2026-09-05T04:00:00Z')), '2026-09-04');

// Tolerancia al retraso del cron: el digest dispara 08:47Z y aguanta ~19 h sin mover el objetivo.
const base = Date.parse('2026-09-04T08:47:00Z');
const conRetraso = [0, 1, 4, 8, 12, 18].map((h) =>
  latestPublishableDate(new Date(base + h * 3_600_000)),
);
eq('08:47Z con retraso de 0 a 18 h', conRetraso, Array(6).fill('2026-09-03'));

section('regresión: el bug de la ventana de gracia de 3 h');
// Constancia de lo que se arregló: la vieja resta saltaba de día al pasar de 07:00Z, y por eso
// los runs retrasados resumían el día en curso (vacío) en vez del día cerrado.
const viejoObjetivo = (iso: string) => newsDateString(new Date(Date.parse(iso) - 3 * 3_600_000));
eq('viejo a 06:59Z: día anterior', viejoObjetivo('2026-09-04T06:59:00Z'), '2026-09-03');
eq('viejo a 07:45Z: salta a hoy (el bug)', viejoObjetivo('2026-09-04T07:45:00Z'), '2026-09-04');
eq(
  'nuevo a 07:45Z: sigue en el día cerrado',
  latestPublishableDate(new Date('2026-09-04T07:45:00Z')),
  '2026-09-03',
);

section('publishableDates: hoy nunca aparece');
const ahora = new Date('2026-09-04T12:00:00Z');
eq('no incluye hoy', publishableDates(7, ahora).includes(newsDateString(ahora)), false);
eq('arranca en ayer', publishableDates(3, ahora), ['2026-09-03', '2026-09-02', '2026-09-01']);
eq('longitud pedida', publishableDates(21, ahora).length, 21);

section('lastNDates: conserva su contrato y ya no depende de sumar 24 h');
eq('incluye hoy', lastNDates(3, ahora), ['2026-09-04', '2026-09-03', '2026-09-02']);
// Restar 86.400.000 ms repetía o saltaba fechas al cruzar un cambio de horario; la aritmética
// de calendario no. 1 nov 2026 (fin de DST) y 8 mar 2026 (inicio).
eq('cruzando fin de DST', lastNDates(4, new Date('2026-11-02T12:00:00Z')), [
  '2026-11-02',
  '2026-11-01',
  '2026-10-31',
  '2026-10-30',
]);
eq('cruzando inicio de DST', lastNDates(4, new Date('2026-03-09T12:00:00Z')), [
  '2026-03-09',
  '2026-03-08',
  '2026-03-07',
  '2026-03-06',
]);

section('claves de Redis');
eq('news:', redisKeyForDate('2026-09-03'), 'news:2026-09-03');
eq('raw: no colisiona con news:', rawKeyForDate('2026-09-03'), 'raw:2026-09-03');

// ------------------------------------------------------- reglas del digest

const item = (
  url: string,
  source: SourceItem['source'],
  points?: number,
): SourceItem => ({
  source,
  title: `t-${url}`,
  url,
  publishedAt: '2026-09-03T12:00:00.000Z',
  excerpt: '',
  ...(points !== undefined && { points }),
});

section('mergeByUrl: raw manda, el feed solo aporta lo que falta');
const raw = [item('a', 'Hacker News', 300), item('b', 'TechCrunch')];
const live = [item('a', 'Hacker News', 5), item('c', 'The Verge')];
const merged = mergeByUrl(raw, live);
eq('sin duplicados', merged.length, 3);
eq('conserva la versión de raw', merged.find((i) => i.url === 'a')?.points, 300);
eq('suma lo que solo está en el feed', merged.some((i) => i.url === 'c'), true);
eq('raw vacío: se queda con el feed', mergeByUrl([], live).length, 2);
eq('feed vacío: se queda con raw', mergeByUrl(raw, []).length, 2);

section('capHackerNews: recorta HN por puntos y no toca otras fuentes');
const muchos: SourceItem[] = [
  ...Array.from({ length: 60 }, (_, i) => item(`hn-${i}`, 'Hacker News', i)),
  item('tc-1', 'TechCrunch'),
  item('verge-1', 'The Verge'),
  item('ars-1', 'Ars Technica'),
];
const capped = capHackerNews(muchos, 50);
eq('HN queda en el tope', capped.filter((i) => i.source === 'Hacker News').length, 50);
eq('las demás fuentes intactas', capped.filter((i) => i.source !== 'Hacker News').length, 3);
eq('conserva el de más puntos', capped.some((i) => i.url === 'hn-59'), true);
eq('descarta el de menos puntos', capped.some((i) => i.url === 'hn-0'), false);
eq('por debajo del tope no altera nada', capHackerNews(muchos.slice(58), 50).length, 5);
// Sin puntos (?? 0) no debe romper el orden
eq('HN sin puntos no rompe', capHackerNews([item('x', 'Hacker News')], 50).length, 1);

section('shouldKeepStored: una corrida pobre no degrada un día bueno');
eq('nuevo peor: se preserva', shouldKeepStored(59, 6), true);
eq('nuevo mejor: se sobrescribe', shouldKeepStored(6, 79), false);
eq('empate: se sobrescribe', shouldKeepStored(50, 50), false);
eq('día nuevo (no había nada)', shouldKeepStored(0, 79), false);
eq('--force ignora la guarda', shouldKeepStored(59, 6, true), false);
// El escenario real que hundió el sitio: un run de madrugada traía 1 item contra los 59 de un
// día completo, y lo sobrescribía sin más.
eq('escenario 21→1: bloqueado', shouldKeepStored(59, 1), true);

console.log(failed === 0 ? '\nTODO OK' : `\n${failed} PRUEBAS FALLARON`);
process.exit(failed === 0 ? 0 : 1);
