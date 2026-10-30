import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useCancelTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'cancel', write: () => ticketApi.cancelTicket(ticketId), change: 'state' });
}
