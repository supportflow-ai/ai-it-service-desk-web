import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useUnassignTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'unassign', write: (expectedRevision: number) => ticketApi.unassignTicket(ticketId, expectedRevision), change: 'state' });
}
