import { newsDateString } from '../../src/lib/date';
import type { SourceName } from '../../src/lib/types';
import { FETCH_TIMEOUT_MS, type RawItem } from '../types';

export type SourceItem = Omit<RawItem, 'index'>;

export interface NewsSource {
  readonly name: SourceName;
  /** Todo lo que el feed expone ahora mismo, sin filtrar por día: lo que consume el recolector. */
  fetchAll(): Promise<SourceItem[]>;
  /** Solo lo publicado en `newsDate` (hora ET). */
  fetchItems(newsDate: string): Promise<SourceItem[]>;
}

/** Un item sin título, sin URL o con fecha ilegible no sirve para nada aguas abajo. */
function isUsable(item: SourceItem): boolean {
  return Boolean(item.title) && Boolean(item.url) && !Number.isNaN(new Date(item.publishedAt).getTime());
}

// Template method: request + validación uniformes; cada adapter solo implementa parse()
// para su protocolo. El filtro por día vive aparte porque el recolector no lo quiere.
export abstract class HttpSource implements NewsSource {
  constructor(
    readonly name: SourceName,
    protected readonly url: string,
  ) {}

  protected abstract parse(body: string): SourceItem[];

  async fetchAll(): Promise<SourceItem[]> {
    const res = await fetch(this.url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': 'RiceTechNews/1.0 (+daily news aggregator)' },
    });
    if (!res.ok) throw new Error(`${this.name}: HTTP ${res.status}`);

    return this.parse(await res.text()).filter(isUsable);
  }

  async fetchItems(newsDate: string): Promise<SourceItem[]> {
    const items = await this.fetchAll();
    return items.filter((item) => newsDateString(new Date(item.publishedAt)) === newsDate);
  }
}
