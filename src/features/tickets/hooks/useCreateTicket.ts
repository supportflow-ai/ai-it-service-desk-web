import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { newIdempotencyKey } from '@/shared/lib/idempotencyKey';
import type { CreateTicketPayload } from '../model/ticket.types';
import { ticketApi } from '../api/ticketApi';
import { invalidateTicketQueries, ticketInvalidation } from '../api/ticketQueries';

export function useCreateTicket() {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  // One key per content (FR-TKT-01): sending the same request again after a failure or a lost
  // response returns the ticket the backend already created; edited content is a new request.
  const attempt = useRef<{ key: string; content: string } | null>(null);
  return useMutation({
    mutationKey: ['tickets', sessionVersion, 'create'],
    mutationFn: async (payload: CreateTicketPayload) => {
      const content = JSON.stringify([payload.title, payload.categoryId, payload.description]);
      if (attempt.current?.content !== content) attempt.current = { key: newIdempotencyKey(), content };
      const ticket = await ticketApi.createTicket(payload, attempt.current.key);
      if (sessionStore.getSnapshot().version !== sessionVersion) throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      return ticket;
    },
    retry: false,
    onSuccess: () => {
      attempt.current = null;
      return invalidateTicketQueries(queryClient, ticketInvalidation.created(sessionVersion));
    },
  });
}
