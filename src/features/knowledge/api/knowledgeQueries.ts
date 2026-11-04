import type { ArticleListFilters, PublishedSearchFilters } from '../model/knowledge.types';

const all = (version: number) => ['knowledge', version] as const;

export const knowledgeKeys = {
  all,
  lists: (version: number) => [...all(version), 'list'] as const,
  list: (version: number, filters: ArticleListFilters) => [...all(version), 'list', { ...filters }] as const,
  /** Under `lists`, so a publish or archive refreshes the reader search too. */
  published: (version: number, filters: PublishedSearchFilters) => [...all(version), 'list', 'published', { ...filters }] as const,
  detail: (version: number, id: string) => [...all(version), 'detail', id] as const,
  /** Prefix of every write, so a pending one can be found per article. */
  writes: (version: number, id: string) => [...all(version), 'write', id] as const,
};
