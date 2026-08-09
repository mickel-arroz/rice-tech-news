import type { SourceName } from '../../src/lib/types';
import { HttpSource, type SourceItem } from './base';

export type JsonMapper = (data: unknown, source: SourceName) => SourceItem[];

export class JsonApiSource extends HttpSource {
  constructor(name: SourceName, url: string, private readonly mapper: JsonMapper) {
    super(name, url);
  }

  protected parse(body: string): SourceItem[] {
    return this.mapper(JSON.parse(body), this.name);
  }
}
