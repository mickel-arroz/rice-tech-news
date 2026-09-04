// El "día de noticias" se define en hora del Este de EE.UU.
const NEWS_TZ = 'America/New_York';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: NEWS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function newsDateString(date: Date = new Date()): string {
  return formatter.format(date);
}

/** Día anterior en el calendario. Aritmética pura sobre la fecha: sin husos ni DST de por medio. */
export function previousDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * El día más reciente publicable: siempre "ayer" en ET, nunca hoy — así el día que se resume
 * ya cerró y sus fuentes están completas.
 *
 * Solo depende de la FECHA ET del instante, no de la hora: cualquier momento del día ET da el
 * mismo resultado. Por eso un retraso del cron de GitHub (que llega a ser de horas) no puede
 * cambiar el día objetivo, a diferencia de la vieja resta de una ventana de gracia fija.
 */
export function latestPublishableDate(now: Date = new Date()): string {
  return previousDate(newsDateString(now));
}

/** n días publicables, del más reciente (ayer) al más antiguo. Nunca incluye hoy. */
export function publishableDates(n: number, now: Date = new Date()): string[] {
  const dates: string[] = [];
  let cursor = latestPublishableDate(now);
  for (let i = 0; i < n; i++) {
    dates.push(cursor);
    cursor = previousDate(cursor);
  }
  return dates;
}

/** Hoy incluido, de más reciente a más antigua. */
export function lastNDates(n: number, from: Date = new Date()): string[] {
  const dates: string[] = [];
  let cursor = newsDateString(from);
  for (let i = 0; i < n; i++) {
    dates.push(cursor);
    cursor = previousDate(cursor);
  }
  return dates;
}

export const DISPLAY_DAYS = 7;
export const LOOKBACK_DAYS = 21;

export const REDIS_KEY_PREFIX = 'news:';

export function redisKeyForDate(date: string): string {
  return `${REDIS_KEY_PREFIX}${date}`;
}

/** Bucket de items crudos acumulados por el recolector, previo al resumen de Gemini. */
export const RAW_KEY_PREFIX = 'raw:';

export function rawKeyForDate(date: string): string {
  return `${RAW_KEY_PREFIX}${date}`;
}
