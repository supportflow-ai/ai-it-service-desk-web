import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import { aiQueryKeys } from '../api/aiQueries';
import type { SuggestionDecisionRequest } from '../model/ai.types';

export type DecisionHandler = (id: string, request: SuggestionDecisionRequest) => Promise<void>;

/** Never retried. `onDecided` lets the host refetch the ticket the decision may have changed. */
export function useSuggestionDecision(
  onDecision?: DecisionHandler,
  onDecided?: () => void,
  ticketId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SuggestionDecisionRequest }) => {
      if (onDecision) return onDecision(id, request);
      return aiApi.submitSuggestionDecision(id, request);
    },
    retry: false,
    onSuccess: () => {
      if (ticketId) {
        void queryClient.invalidateQueries({ queryKey: aiQueryKeys.ticketAnalysis(ticketId) });
      }
      onDecided?.();
    },
  });
}
