import { ticketApi } from '../api/ticketApi';
import type { PendingTicketStatus } from '../model/ticket.types';
import { useTicketWrite } from './useTicketWrite';

interface PauseTicketVariables {
  status: PendingTicketStatus;
  expectedRevision: number;
}

export function usePauseTicket(ticketId: string) {
  return useTicketWrite({
    ticketId,
    action: 'pause',
    write: ({ status, expectedRevision }: PauseTicketVariables) => ticketApi.pauseTicket(ticketId, status, expectedRevision),
    change: 'state',
  });
}
