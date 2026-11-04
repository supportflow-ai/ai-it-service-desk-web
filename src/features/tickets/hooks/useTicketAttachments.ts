import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import { isTicketId } from '../model/ticketId';

export function useTicketAttachments(ticketId: string) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: ticketKeys.attachments(sessionVersion, ticketId),
    queryFn: ({ signal }) => ticketApi.getTicketAttachments(ticketId, signal),
    enabled: status === 'authenticated' && isTicketId(ticketId),
  });
}
