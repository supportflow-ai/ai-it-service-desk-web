import { useSearchParams } from 'react-router-dom';
import { parseAgentQueueSearch, toAgentQueueSearch } from '../lib/agentQueueSearch';
import type { AgentQueueFilters } from '../model/ticket.types';

/** Queue filters live in the URL so they survive opening a ticket and coming back. */
export function useAgentQueueFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseAgentQueueSearch(searchParams);
  const setFilters = (next: AgentQueueFilters) => setSearchParams(toAgentQueueSearch(next), { replace: true });
  // Normalized, so unknown or invalid parameters are not carried along.
  const query = toAgentQueueSearch(filters).toString();
  return { filters, setFilters, search: query ? `?${query}` : '' };
}
