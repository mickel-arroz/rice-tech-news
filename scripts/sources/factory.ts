import type { SourceName } from '../../src/lib/types';
import { stripHtml, truncate } from '../types';
import type { NewsSource, SourceItem } from './base';
import { JsonApiSource, type JsonMapper } from './json-source';
import { RssSource } from './rss-source';

export type SourceConfig =
  | { kind: 'rss'; name: SourceName; url: string }
  | { kind: 'json'; name: SourceName; url: string; mapper: JsonMapper };

interface HNHit {
  title: string;
  url: string | null;
  objectID: string;
  points: number;
  num_comments: number;
  created_at: string;
  story_text: string | null;
}

const hackerNewsMapper: JsonMapper = (data, source): SourceItem[] =>
  ((data as { hits: HNHit[] }).hits ?? []).map((hit) => ({
    source,
    title: stripHtml(hit.title ?? ''),
    url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
    publishedAt: new Date(hit.created_at).toISOString(),
    excerpt: truncate(stripHtml(hit.story_text ?? '')),
    points: hit.points,
    comments: hit.num_comments,
  }));

// Registro de fuentes: agregar una nueva = añadir una entrada aquí
export const SOURCE_CONFIGS: SourceConfig[] = [
  {
    kind: 'json',
    // `tags=front_page` ignora hitsPerPage: tope a las ~30 historias de la portada actual,
    // repartidas en varios días (≈12 por día). `search_by_date` sí pagina, y el umbral de
    // puntos filtra el ruido de /newest sin recortar el día. Cobertura medida: ~83 items/día
    // contra 12. Los puntos suben con el tiempo, pero el recolector vuelve a pasar cada 2 h
    // y el HSET por URL actualiza la historia cuando cruza el umbral.
    name: 'Hacker News',
    url: 'https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=100&numericFilters=points%3E20',
    mapper: hackerNewsMapper,
  },
  { kind: 'rss', name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { kind: 'rss', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { kind: 'rss', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
];

export function createSource(config: SourceConfig): NewsSource {
  switch (config.kind) {
    case 'rss':
      return new RssSource(config.name, config.url);
    case 'json':
      return new JsonApiSource(config.name, config.url, config.mapper);
  }
}

export function createAllSources(): NewsSource[] {
  return SOURCE_CONFIGS.map(createSource);
}
