import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useUnassignTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'unassign', write: () => ticketApi.unassignTicket(ticketId), change: 'state' });
}
