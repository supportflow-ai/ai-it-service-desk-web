import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useAssignTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'assign', write: (agentId: string) => ticketApi.assignTicket(ticketId, agentId), change: 'state' });
}
