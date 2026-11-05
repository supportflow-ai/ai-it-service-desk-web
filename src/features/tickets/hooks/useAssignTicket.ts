import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

interface AssignTicketVariables {
  agentId: string;
  expectedRevision: number;
}

export function useAssignTicket(ticketId: string) {
  return useTicketWrite({
    ticketId,
    action: 'assign',
    write: ({ agentId, expectedRevision }: AssignTicketVariables) => ticketApi.assignTicket(ticketId, agentId, expectedRevision),
    change: 'state',
  });
}
