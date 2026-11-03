import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useResolveTicket(ticketId: string, expectedRevision?: number) {
  return useTicketWrite({ ticketId, expectedRevision, action: 'resolve', write: (_: void, revision?: number) => ticketApi.resolveTicket(ticketId, revision), change: 'state' });
}
