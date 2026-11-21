import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/aiApi';
import { aiQueryKeys } from '../api/aiQueries';

export function useTicketAIAnalysis(ticketId: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: aiQueryKeys.ticketAnalysis(ticketId),
    queryFn: ({ signal }) => aiApi.getTicketAIAnalysis(ticketId, signal),
    enabled: enabled && !!ticketId,
    retry: false,
  });

  const reanalyze = useMutation({
    mutationFn: () => aiApi.triggerTicketAnalysis(ticketId),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiQueryKeys.ticketAnalysis(ticketId) });
    },
  });

  return {
    ...query,
    reanalyze: reanalyze.mutate,
    isReanalyzing: reanalyze.isPending,
  };
}
