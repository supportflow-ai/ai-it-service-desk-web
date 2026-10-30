import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useResolveTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'resolve', write: () => ticketApi.resolveTicket(ticketId), change: 'state' });
}
