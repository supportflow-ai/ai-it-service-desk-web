import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import type { AddInternalNotePayload } from '../model/ticket.types';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';

export function useAddInternalNote(ticketId: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['tickets', sessionVersion, 'add-internal-note', ticketId],
    mutationFn: async (payload: AddInternalNotePayload) => {
      const item = await ticketApi.addInternalNote(payload);
      if (sessionStore.getSnapshot().version !== sessionVersion) {
        throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      }
      return item;
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ticketKeys.timeline(sessionVersion, ticketId) });
    },
  });
}
