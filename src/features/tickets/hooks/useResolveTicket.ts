import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';

export function useResolveTicket(ticketId: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['tickets', sessionVersion, 'resolve', ticketId],
    mutationFn: async () => {
      const ticket = await ticketApi.resolveTicket(ticketId);
      if (sessionStore.getSnapshot().version !== sessionVersion) {
        throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      }
      return ticket;
    },
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(sessionVersion, ticketId) }),
        queryClient.invalidateQueries({ queryKey: ticketKeys.session(sessionVersion) }),
        queryClient.invalidateQueries({ queryKey: ticketKeys.timeline(sessionVersion, ticketId) }),
      ]);
    },
  });
}
