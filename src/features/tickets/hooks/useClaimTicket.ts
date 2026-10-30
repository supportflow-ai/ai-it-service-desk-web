import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useClaimTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'claim', write: () => ticketApi.claimTicket(ticketId), change: 'state' });
}
