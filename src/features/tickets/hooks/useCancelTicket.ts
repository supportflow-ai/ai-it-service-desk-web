import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useCancelTicket(ticketId: string, expectedRevision?: number) {
  return useTicketWrite({ ticketId, expectedRevision, action: 'cancel', write: (_: void, revision?: number) => ticketApi.cancelTicket(ticketId, revision), change: 'state' });
}
