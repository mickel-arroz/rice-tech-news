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
    about: 'Acerca de',
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
    about: 'About',
  },
} satisfies Record<Lang, Record<string, string | ((n: number) => string)>>;

export type UIStrings = (typeof strings)[Lang];

/** URL del repositorio público del proyecto. */
export const GITHUB_REPO_URL = 'https://github.com/mickel-arroz/rice-tech-news';

/** Enlaces del autor (compartidos entre el footer y la modal "Acerca de"). */
export const AUTHOR = {
  name: 'Mickel Arroz',
  linkedin: 'https://www.linkedin.com/in/mickel-arroz/',
  portfolio: 'https://portfolio-mickel-arroz.vercel.app/',
} as const;

/** Fuentes de noticias con enlace a su sitio (coincide con `SOURCE_CONFIGS`). */
export const aboutSources = [
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'TechCrunch', url: 'https://techcrunch.com' },
  { name: 'The Verge', url: 'https://www.theverge.com' },
  { name: 'Ars Technica', url: 'https://arstechnica.com' },
] as const;

interface AboutContent {
  title: string;
  intro: string;
  whatTitle: string;
  whatBody: string;
  sourcesTitle: string;
  techTitle: string;
  tech: string[];
  aiTitle: string;
  aiBody: string;
  aiModel: string;
  creditsTitle: string;
  creditsBody: string;
  viewOnGithub: string;
}

/** Contenido de la modal "Acerca de" — separado de `strings` por tener forma anidada. */
export const aboutContent = {
  es: {
    title: 'Acerca del proyecto',
    intro:
      'Rice Tech News reúne cada día las noticias más relevantes de tecnología y programación, las agrupa y las resume con inteligencia artificial, en español e inglés.',
    whatTitle: 'Cómo funciona',
    whatBody:
      'Un proceso automatizado se ejecuta cada noche (GitHub Actions, ~11:00 PM hora del Este de EE.UU.): recopila las noticias de varias fuentes, las agrupa en historias, genera un resumen bilingüe con IA y lo guarda en Upstash Redis. El sitio, construido con Astro y desplegado en Vercel, sirve esos resúmenes al instante.',
    sourcesTitle: 'Fuentes de noticias',
    techTitle: 'Tecnologías',
    tech: [
      'Astro',
      'React',
      'TypeScript',
      'Tailwind CSS 4',
      'Upstash Redis',
      'Vercel',
      'GitHub Actions',
    ],
    aiTitle: 'Inteligencia artificial',
    aiBody:
      'Los resúmenes y la agrupación de historias se generan con Google AI Studio.',
    aiModel: 'Gemini 3.5 Flash',
    creditsTitle: 'Créditos',
    creditsBody: 'Diseñado y desarrollado por Mickel Arroz.',
    viewOnGithub: 'Ver en GitHub',
  },
  en: {
    title: 'About the project',
    intro:
      'Rice Tech News gathers the most relevant tech and programming news every day, clusters it, and summarizes it with artificial intelligence, in Spanish and English.',
    whatTitle: 'How it works',
    whatBody:
      'An automated job runs every night (GitHub Actions, ~11:00 PM US Eastern time): it collects news from several sources, groups them into stories, generates a bilingual summary with AI, and stores it in Upstash Redis. The site, built with Astro and deployed on Vercel, serves those summaries instantly.',
    sourcesTitle: 'News sources',
    techTitle: 'Technologies',
    tech: [
      'Astro',
      'React',
      'TypeScript',
      'Tailwind CSS 4',
      'Upstash Redis',
      'Vercel',
      'GitHub Actions',
    ],
    aiTitle: 'Artificial intelligence',
    aiBody: 'Summaries and story clustering are generated with Google AI Studio.',
    aiModel: 'Gemini 3.5 Flash',
    creditsTitle: 'Credits',
    creditsBody: 'Designed and developed by Mickel Arroz.',
    viewOnGithub: 'View on GitHub',
  },
} satisfies Record<Lang, AboutContent>;

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
