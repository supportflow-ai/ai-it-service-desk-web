import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useReopenTicket(ticketId: string, expectedRevision?: number) {
  return useTicketWrite({ ticketId, expectedRevision, action: 'reopen', write: (_: void, revision?: number) => ticketApi.reopenTicket(ticketId, revision), change: 'state' });
}
