import { useMutation } from '@tanstack/react-query';
import { AppError } from '@/shared/api/httpError';
import type { SuggestionDecisionRequest } from '../model/ai.types';

export type DecisionHandler = (id: string, request: SuggestionDecisionRequest) => Promise<void>;

export function useSuggestionDecision(onDecision?: DecisionHandler) {
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: SuggestionDecisionRequest }) => {
      if (!onDecision) throw new AppError('AI review chưa được hỗ trợ.', 'unknown');
      return onDecision(id, request);
    },
    retry: false,
  });
}
