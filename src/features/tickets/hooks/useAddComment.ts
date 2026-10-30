import type { AddCommentPayload } from '../model/ticket.types';
import { ticketApi } from '../api/ticketApi';
import { useTicketWrite } from './useTicketWrite';

export function useAddComment(ticketId: string) {
  return useTicketWrite({ ticketId, action: 'add-comment', write: (payload: AddCommentPayload) => ticketApi.addComment(payload), change: 'conversation' });
}
