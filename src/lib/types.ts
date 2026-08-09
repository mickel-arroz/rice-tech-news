export type Lang = 'es' | 'en';

export type SourceName =
  | 'Hacker News'
  | 'TechCrunch'
  | 'The Verge'
  | 'Ars Technica';

export interface StorySource {
  name: SourceName;
  url: string;
  title: string;
  points?: number;
  comments?: number;
}

export interface LocalizedStory {
  id: string;
  title: string;
  shortSummary: string;
  longSummary: string[];
  tags: string[];
  sources: StorySource[];
  publishedAt: string;
}

export interface LocalizedDay {
  summary: string;
  stories: LocalizedStory[];
}

export interface DayMeta {
  date: string;
  generatedAt: string;
  model: string;
  stats: { collected: number; stories: number };
}

/** Registro completo en Redis: metadata + una rama autocontenida por idioma. */
export type DayRecord = DayMeta & Record<Lang, LocalizedDay>;

/** Respuesta de /api/news: metadata + solo el idioma solicitado, ya aplanado. */
export type DayResponse = DayMeta & LocalizedDay;

export interface DateAvailability {
  date: string;
  available: boolean;
}
