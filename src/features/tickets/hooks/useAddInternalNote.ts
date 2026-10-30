import type { AddInternalNotePayload } from '../model/ticket.types';
import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useAddInternalNote(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'add-internal-note', write: (payload: AddInternalNotePayload) => ticketApi.addInternalNote(payload), change: 'conversation' });
}
