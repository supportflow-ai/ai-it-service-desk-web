import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import { isTicketId } from '../model/ticketId';

export function useTicket(id: string) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: ticketKeys.detail(sessionVersion, id),
    queryFn: ({ signal }) => ticketApi.getTicketById(id, signal),
    enabled: status === 'authenticated' && isTicketId(id),
  });
}
