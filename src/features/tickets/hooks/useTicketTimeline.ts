import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import { isTicketId } from '../model/ticketId';

export function useTicketTimeline(ticketId: string) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: ticketKeys.timeline(sessionVersion, ticketId),
    queryFn: ({ signal }) => ticketApi.getTicketTimeline(ticketId, signal),
    enabled: status === 'authenticated' && isTicketId(ticketId),
  });
}
