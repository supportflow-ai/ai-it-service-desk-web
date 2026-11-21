import { AgentReviewPanel } from './AgentReviewPanel';
import { useTicketAIAnalysis } from '../hooks/useTicketAIAnalysis';
import { useSuggestionDecision } from '../hooks/useSuggestionDecision';
import type { SuggestionDecisionRequest } from '../model/ai.types';

interface WorkspaceTriagePanelProps {
  ticketId: string;
  /** Refetches the ticket after a review decision changed its fields. */
  onTicketChanged: () => void;
  /**
   * Whether the AI triage endpoint is enabled.
   * Following AGENTS.md §13 and §21, unconfirmed capabilities do not send HTTP requests to projected endpoints.
   */
  enabled?: boolean;
}

/**
 * The AI slot of the agent workspace. Connects to the backend AI analysis and review decision API.
 * Defaults to disabled while backend contract is pending, displaying the clean not-enabled state
 * without sending unconfirmed HTTP requests.
 */
export function WorkspaceTriagePanel({ ticketId, onTicketChanged, enabled = false }: WorkspaceTriagePanelProps) {
  const { data, isLoading, reanalyze } = useTicketAIAnalysis(ticketId, enabled);
  const decision = useSuggestionDecision(undefined, onTicketChanged, ticketId);

  const handleDecision = async (id: string, request: SuggestionDecisionRequest) => {
    await decision.mutateAsync({ id, request });
  };

  if (!enabled) {
    return <AgentReviewPanel key={ticketId} result={null} ticketRevision={null} onDecided={onTicketChanged} />;
  }

  return (
    <AgentReviewPanel
      key={ticketId}
      result={data?.result ?? null}
      ticketRevision={data?.ticketRevision ?? null}
      suggestions={data?.suggestions ?? []}
      loading={isLoading}
      stale={data?.stale ?? false}
      onDecision={handleDecision}
      onReanalyze={() => reanalyze()}
      onDecided={onTicketChanged}
    />
  );
}
