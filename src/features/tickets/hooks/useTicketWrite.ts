import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { invalidateTicketQueries, ticketInvalidation, ticketKeys } from '../api/ticketQueries';
import type { TicketChange } from '../api/ticketQueries';

interface TicketWriteOptions<TResult, TVariables> {
  ticketId: string;
  action: string;
  write: (variables: TVariables) => Promise<TResult>;
  change: TicketChange;
}

/**
 * The one write path for an existing ticket: never retried, a response from an ended
 * session is discarded, and success invalidates exactly the reads the change affects.
 */
export function useTicketWrite<TResult, TVariables = void>({ ticketId, action, write, change }: TicketWriteOptions<TResult, TVariables>) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ticketKeys.write(sessionVersion, ticketId, action),
    mutationFn: async (variables: TVariables) => {
      const result = await write(variables);
      if (sessionStore.getSnapshot().version !== sessionVersion) {
        throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      }
      return result;
    },
    retry: false,
    onSuccess: () => invalidateTicketQueries(queryClient, ticketInvalidation[change](sessionVersion, ticketId)),
  });
}
