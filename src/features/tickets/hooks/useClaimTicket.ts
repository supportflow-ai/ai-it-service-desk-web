import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useClaimTicket(ticketId: string, expectedRevision?: number) {
  return useTicketWrite({ ticketId, expectedRevision, action: 'claim', write: (_: void, revision?: number) => ticketApi.claimTicket(ticketId, revision), change: 'state' });
}
