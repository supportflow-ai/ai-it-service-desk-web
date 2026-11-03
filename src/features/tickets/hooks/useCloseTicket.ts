import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useCloseTicket(ticketId: string, expectedRevision?: number) {
  return useTicketWrite({ ticketId, expectedRevision, action: 'close', write: (_: void, revision?: number) => ticketApi.closeTicket(ticketId, revision), change: 'state' });
}
