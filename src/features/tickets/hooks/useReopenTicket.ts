import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useReopenTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'reopen', write: (expectedRevision: number) => ticketApi.reopenTicket(ticketId, expectedRevision), change: 'state' });
}
