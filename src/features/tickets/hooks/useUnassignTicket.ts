import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useUnassignTicket(ticketId: string, expectedRevision?: number) {
  return useTicketWrite({ ticketId, expectedRevision, action: 'unassign', write: (_: void, revision?: number) => ticketApi.unassignTicket(ticketId, revision), change: 'state' });
}
