import type { Lang } from './types';

export const LANG_STORAGE_KEY = 'rtn:lang';
export const DEFAULT_LANG: Lang = 'es';

export const strings = {
  es: {
    tagline: 'Noticias de tecnología y programación, resumidas por IA',
    dailySummary: 'Resumen del día',
    stories: 'Noticias',
    sources: 'Fuentes',
    readMore: 'Ver resumen completo',
    openOriginal: 'Abrir artículo original',
    points: 'puntos',
    comments: 'comentarios',
    loading: 'Cargando transmisión…',
    emptyTitle: 'Sin datos para este día',
    emptyBody:
      'Aún no hay noticias procesadas para esta fecha. El sistema se actualiza al final de cada día (~11:00 PM, hora del Este de EE.UU.).',
    errorTitle: 'Error de conexión',
    errorBody: 'No se pudo recuperar la transmisión de noticias.',
    retry: 'Reintentar',
    today: 'Hoy',
    close: 'Cerrar',
    developedBy: 'Desarrollado por',
    storiesCount: (n: number) => `${n} noticias`,
    langLabel: 'Idioma',
  },
  en: {
    tagline: 'Tech & programming news, summarized by AI',
    dailySummary: 'Daily briefing',
    stories: 'Stories',
    sources: 'Sources',
    readMore: 'View full summary',
    openOriginal: 'Open original article',
    points: 'points',
    comments: 'comments',
    loading: 'Loading transmission…',
    emptyTitle: 'No data for this day',
    emptyBody:
      'No processed news for this date yet. The system updates at the end of each day (~11:00 PM US Eastern time).',
    errorTitle: 'Connection error',
    errorBody: 'The news transmission could not be retrieved.',
    retry: 'Retry',
    today: 'Today',
    close: 'Close',
    developedBy: 'Developed by',
    storiesCount: (n: number) => `${n} stories`,
    langLabel: 'Language',
  },
} satisfies Record<Lang, Record<string, string | ((n: number) => string)>>;

export type UIStrings = (typeof strings)[Lang];

/** Etiqueta de fecha para los tabs: "vie 08/08" / "Fri 08/08" según idioma. */
export function dateTabLabel(date: string, lang: Lang): string {
  const d = new Date(`${date}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat(lang === 'es' ? 'es-VE' : 'en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(d);
  const [, month, day] = date.split('-');
  return `${weekday} ${day}/${month}`;
}

export function dateLongLabel(date: string, lang: Lang): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-VE' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}
