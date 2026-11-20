import type { RagSourceAdapter } from '../model/rag.types';
import { RagEvidencePanel } from './RagEvidencePanel';

interface WorkspaceRagPanelProps {
  ticketId: string;
  sources?: RagSourceAdapter;
}

/**
 * The RAG slot of the agent workspace. Neither the backend OpenAPI baseline nor ai-service defines
 * a RAG/generation endpoint yet (AISD-S4-02 upstream), so this shows the not-enabled state and
 * sends no request. Plug the query in here once the contract exists; the panel already renders
 * the answer, citation, no-evidence, unavailable and loading states.
 */
export function WorkspaceRagPanel({ ticketId, sources }: WorkspaceRagPanelProps) {
  return <RagEvidencePanel key={ticketId} result={null} sources={sources} />;
}
