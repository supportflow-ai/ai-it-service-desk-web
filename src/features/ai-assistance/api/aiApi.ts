import { apiClient } from '@/shared/api/apiClient';
import { normalizeError } from '@/shared/api/httpError';
import type { SuggestionDecisionRequest, TicketAIAnalysisResponse } from '../model/ai.types';

export const aiApi = {
  async getTicketAIAnalysis(ticketId: string, signal?: AbortSignal): Promise<TicketAIAnalysisResponse | null> {
    try {
      const response = await apiClient.get<TicketAIAnalysisResponse>(`/tickets/${ticketId}/ai-analysis`, { signal });
      return response.data;
    } catch (error) {
      const normalized = normalizeError(error);
      // When the backend has no AI analysis endpoint or AI is not enabled for this ticket,
      // return null to gracefully show the "AI chưa được bật" state without failing the page.
      if (normalized.status === 404 || normalized.status === 501) {
        return null;
      }
      throw normalized;
    }
  },

  async submitSuggestionDecision(suggestionId: string, request: SuggestionDecisionRequest, signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.post(`/ai/suggestions/${suggestionId}/decision`, request, { signal });
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async triggerTicketAnalysis(ticketId: string, signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.post(`/tickets/${ticketId}/ai-analysis`, {}, { signal });
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
