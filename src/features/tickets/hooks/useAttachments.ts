import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import { isTicketId } from '../model/ticketId';

export function useAttachments(ticketId: string) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: ticketKeys.attachments(sessionVersion, ticketId),
    queryFn: ({ signal }) => ticketApi.getAttachments(ticketId, signal),
    enabled: status === 'authenticated' && isTicketId(ticketId),
  });
}
