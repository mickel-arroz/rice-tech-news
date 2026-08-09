import type { SourceName } from '../src/lib/types';

/** Item normalizado tal como sale de cada fuente, antes de pasar por la IA. */
export interface RawItem {
  index: number;
  source: SourceName;
  title: string;
  url: string;
  publishedAt: string;
  excerpt: string;
  points?: number;
  comments?: number;
}

export const FETCH_TIMEOUT_MS = 15_000;
export const EXCERPT_MAX_CHARS = 400;

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&ldquo;|&#8221;|&rdquo;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(text: string, max = EXCERPT_MAX_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

