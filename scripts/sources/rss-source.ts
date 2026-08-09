import { XMLParser } from 'fast-xml-parser';
import { stripHtml, truncate } from '../types';
import { HttpSource, type SourceItem } from './base';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    return String((node as Record<string, unknown>)['#text'] ?? '');
  }
  return '';
}

// Un entry Atom puede traer el link como string o como lista de <link href rel>
function atomLink(entry: Record<string, unknown>): string {
  for (const l of asArray(entry.link as unknown)) {
    if (typeof l === 'string') return l;
    const rec = l as Record<string, unknown>;
    if (!rec['@_rel'] || rec['@_rel'] === 'alternate') {
      return String(rec['@_href'] ?? '');
    }
  }
  return '';
}

// Soporta RSS 2.0 (<item>/<pubDate>) y Atom (<entry>/<published>)
export class RssSource extends HttpSource {
  protected parse(body: string): SourceItem[] {
    const doc = parser.parse(body);
    const items: SourceItem[] = [];

    for (const item of asArray(doc?.rss?.channel?.item) as Record<string, unknown>[]) {
      const published = textOf(item.pubDate) || textOf(item['dc:date']);
      if (!published) continue;
      const description = textOf(item['content:encoded']) || textOf(item.description);
      items.push({
        source: this.name,
        title: stripHtml(textOf(item.title)),
        url: textOf(item.link),
        publishedAt: new Date(published).toISOString(),
        excerpt: truncate(stripHtml(description)),
      });
    }

    for (const entry of asArray(doc?.feed?.entry) as Record<string, unknown>[]) {
      const published = textOf(entry.published) || textOf(entry.updated);
      if (!published) continue;
      const content = textOf(entry.content) || textOf(entry.summary);
      items.push({
        source: this.name,
        title: stripHtml(textOf(entry.title)),
        url: atomLink(entry),
        publishedAt: new Date(published).toISOString(),
        excerpt: truncate(stripHtml(content)),
      });
    }

    return items;
  }
}
