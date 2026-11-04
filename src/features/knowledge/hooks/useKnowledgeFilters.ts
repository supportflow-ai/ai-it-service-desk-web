import { useSearchParams } from 'react-router-dom';
import { parseKnowledgeSearch, toKnowledgeSearch } from '../lib/knowledgeSearch';
import type { ArticleListFilters } from '../model/knowledge.types';

/** List filters live in the URL so they survive opening an article and coming back. */
export function useKnowledgeFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseKnowledgeSearch(searchParams);
  const setFilters = (next: ArticleListFilters) => setSearchParams(toKnowledgeSearch(next), { replace: true });
  return { filters, setFilters };
}
