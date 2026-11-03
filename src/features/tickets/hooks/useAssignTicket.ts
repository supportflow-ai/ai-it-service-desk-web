import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useAssignTicket(ticketId: string, expectedRevision?: number) {
  return useTicketWrite({ ticketId, expectedRevision, action: 'assign', write: (agentId: string, revision?: number) => ticketApi.assignTicket(ticketId, agentId, revision), change: 'state' });
}
