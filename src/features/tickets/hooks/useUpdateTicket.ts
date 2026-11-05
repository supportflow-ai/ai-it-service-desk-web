import { ticketApi } from '../api/ticketApi';
import type { UpdateTicketPayload } from '../model/ticket.types';
import { useTicketWrite } from './useTicketWrite';

interface UpdateTicketVariables {
  payload: UpdateTicketPayload;
  expectedRevision: number;
}

/** A 'state' write: the ticket and the lists that show its title change, and status writes wait for it. */
export function useUpdateTicket(ticketId: string) {
  return useTicketWrite({
    ticketId,
    action: 'update',
    write: ({ payload, expectedRevision }: UpdateTicketVariables) => ticketApi.updateTicket(ticketId, payload, expectedRevision),
    change: 'state',
  });
}
