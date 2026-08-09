import { newsDateString } from '../../src/lib/date';
import type { SourceName } from '../../src/lib/types';
import { FETCH_TIMEOUT_MS, type RawItem } from '../types';

export type SourceItem = Omit<RawItem, 'index'>;

export interface NewsSource {
  readonly name: SourceName;
  fetchItems(newsDate: string): Promise<SourceItem[]>;
}

// Template method: request + validación + filtro "publicado el día de la corrida"
// uniformes; cada adapter solo implementa parse() para su protocolo
export abstract class HttpSource implements NewsSource {
  constructor(
    readonly name: SourceName,
    protected readonly url: string,
  ) {}

  protected abstract parse(body: string): SourceItem[];

  async fetchItems(newsDate: string): Promise<SourceItem[]> {
    const res = await fetch(this.url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': 'RiceTechNews/1.0 (+daily news aggregator)' },
    });
    if (!res.ok) throw new Error(`${this.name}: HTTP ${res.status}`);

    return this.parse(await res.text()).filter(
      (item) =>
        item.title &&
        item.url &&
        !Number.isNaN(new Date(item.publishedAt).getTime()) &&
        newsDateString(new Date(item.publishedAt)) === newsDate,
    );
  }
}
