import { useMutation } from '@tanstack/react-query';
import { AppError } from '@/shared/api/httpError';
import type { SuggestionDecisionRequest } from '../model/ai.types';

export type DecisionHandler = (id: string, request: SuggestionDecisionRequest) => Promise<void>;

/** Never retried. `onDecided` lets the host refetch the ticket the decision may have changed. */
export function useSuggestionDecision(onDecision?: DecisionHandler, onDecided?: () => void) {
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SuggestionDecisionRequest }) => {
      if (!onDecision) throw new AppError('Chưa thể ghi quyết định: hệ thống chưa có API review gợi ý AI.', 'unknown');
      return onDecision(id, request);
    },
    retry: false,
    onSuccess: () => onDecided?.(),
  });
}
