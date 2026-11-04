import { useSearchParams } from 'react-router-dom';
import { parsePublishedSearch, toPublishedSearch } from '../lib/knowledgeSearch';
import type { PublishedSearchFilters } from '../model/knowledge.types';

/** The reader search lives in the URL, so a search can be shared and survives opening an article. */
export function usePublishedSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parsePublishedSearch(searchParams);
  const setFilters = (next: PublishedSearchFilters) => setSearchParams(toPublishedSearch(next), { replace: true });
  // Normalized, so unknown or invalid parameters are not carried along.
  const query = toPublishedSearch(filters).toString();
  return { filters, setFilters, search: query ? `?${query}` : '' };
}
