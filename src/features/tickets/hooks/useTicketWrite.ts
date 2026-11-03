import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError, normalizeError } from '@/shared/api/httpError';
import { invalidateTicketQueries, ticketInvalidation, ticketKeys } from '../api/ticketQueries';
import type { TicketDto } from '../model/ticket.types';
import type { TicketChange } from '../api/ticketQueries';

interface TicketWriteOptions<TResult, TVariables> {
  ticketId: string;
  action: string;
  write: (variables: TVariables, expectedRevision?: number) => Promise<TResult>;
  expectedRevision?: number;
  change: TicketChange;
}

/**
 * The one write path for an existing ticket: never retried, a response from an ended
 * session is discarded, and success invalidates exactly the reads the change affects.
 * A 404 means the ticket is gone or out of scope, so its reads are refreshed to show that.
 */
export function useTicketWrite<TResult, TVariables = void>({ ticketId, action, write, change, expectedRevision }: TicketWriteOptions<TResult, TVariables>) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ticketKeys.write(sessionVersion, ticketId, change, action),
    mutationFn: async (variables: TVariables) => {
      if (sessionStore.getSnapshot().version !== sessionVersion) throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      const revision = expectedRevision ?? queryClient.getQueryData<TicketDto>(ticketKeys.detail(sessionVersion, ticketId))?.revision;
      const result = await write(variables, change === 'state' ? revision : undefined);
      if (sessionStore.getSnapshot().version !== sessionVersion) {
        throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      }
      return result;
    },
    retry: false,
    onSuccess: () => {
      if (sessionStore.getSnapshot().version !== sessionVersion) return;
      return invalidateTicketQueries(queryClient, ticketInvalidation[change](sessionVersion, ticketId));
    },
    onError: (error) => {
      if (sessionStore.getSnapshot().version !== sessionVersion) return;
      if (normalizeError(error).status !== 404) return;
      void invalidateTicketQueries(queryClient, ticketInvalidation.state(sessionVersion, ticketId));
    },
  });
}
