// El "día de noticias" se define en hora del Este de EE.UU. (el Action corre ~11pm ET)
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

/** Hoy incluido, de más reciente a más antigua. */
export function lastNDates(n: number, from: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    dates.push(newsDateString(new Date(from.getTime() - i * 86_400_000)));
  }
  return dates;
}

export const REDIS_KEY_PREFIX = 'news:';

export function redisKeyForDate(date: string): string {
  return `${REDIS_KEY_PREFIX}${date}`;
}
