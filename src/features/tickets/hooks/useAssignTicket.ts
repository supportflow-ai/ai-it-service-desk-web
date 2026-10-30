import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';

export function useAssignTicket(ticketId: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['tickets', sessionVersion, 'assign', ticketId],
    mutationFn: async (agentId: string) => {
      const ticket = await ticketApi.assignTicket(ticketId, agentId);
      if (sessionStore.getSnapshot().version !== sessionVersion) {
        throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      }
      return ticket;
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ticketKeys.session(sessionVersion) });
    },
  });
}
