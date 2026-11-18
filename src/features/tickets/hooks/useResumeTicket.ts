import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useResumeTicket(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'resume', write: (expectedRevision: number) => ticketApi.resumeTicket(ticketId, expectedRevision), change: 'state' });
}
