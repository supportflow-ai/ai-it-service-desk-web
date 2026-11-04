import type { ArticleListFilters } from '../model/knowledge.types';

const all = (version: number) => ['knowledge', version] as const;

export const knowledgeKeys = {
  all,
  lists: (version: number) => [...all(version), 'list'] as const,
  list: (version: number, filters: ArticleListFilters) => [...all(version), 'list', { ...filters }] as const,
};
