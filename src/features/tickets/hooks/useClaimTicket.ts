import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useClaimTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'claim', write: (expectedRevision: number) => ticketApi.claimTicket(ticketId, expectedRevision), change: 'state' });
}
