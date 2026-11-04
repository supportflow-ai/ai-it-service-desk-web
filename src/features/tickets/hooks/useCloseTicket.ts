import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useCloseTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'close', write: (expectedRevision: number) => ticketApi.closeTicket(ticketId, expectedRevision), change: 'state' });
}
