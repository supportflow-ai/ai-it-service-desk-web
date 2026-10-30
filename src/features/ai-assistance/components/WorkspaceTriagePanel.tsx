import { AgentReviewPanel } from './AgentReviewPanel';

interface WorkspaceTriagePanelProps {
  ticketId: string;
  /** Refetches the ticket after a review decision changed its fields. */
  onTicketChanged: () => void;
}

/**
 * The AI slot of the agent workspace. No backend endpoint serves triage results or review
 * decisions yet (backend dev 8fe5c43; TC-277 records "dev integration BLOCKED"), so this
 * shows the not-enabled state and sends no request. Plug the triage query in here once the
 * API exists; the panel already renders every result state.
 */
export function WorkspaceTriagePanel({ ticketId, onTicketChanged }: WorkspaceTriagePanelProps) {
  return <AgentReviewPanel key={ticketId} result={null} ticketRevision={null} onDecided={onTicketChanged} />;
}
