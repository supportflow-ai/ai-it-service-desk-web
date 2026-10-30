import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import type { AgentQueueFilters } from '../model/ticket.types';

export function useAgentQueue(filters: AgentQueueFilters) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: ticketKeys.queue(sessionVersion, filters),
    queryFn: ({ signal }) => ticketApi.getAgentQueue(filters, signal),
    enabled: status === 'authenticated',
  });
}
