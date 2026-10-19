import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import type { CreateTicketPayload } from '../model/ticket.types';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';

export function useCreateTicket() {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['tickets', sessionVersion, 'create'],
    mutationFn: async (payload: CreateTicketPayload) => {
      const ticket = await ticketApi.createTicket(payload);
      if (sessionStore.getSnapshot().version !== sessionVersion) throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      return ticket;
    },
    retry: false,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ticketKeys.session(sessionVersion) }); },
  });
}
