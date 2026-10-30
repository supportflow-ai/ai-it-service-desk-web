import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useCloseTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'close', write: () => ticketApi.closeTicket(ticketId), change: 'state' });
}
