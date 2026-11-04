import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useResolveTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'resolve', write: (expectedRevision: number) => ticketApi.resolveTicket(ticketId, expectedRevision), change: 'state' });
}
