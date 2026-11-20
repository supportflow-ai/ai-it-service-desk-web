import { lazy, Suspense } from 'react';
import { Space } from 'antd';
import { hasAnyRole, useAuth } from '@/features/auth';
import { routeConfig as routes } from './routeConfig';

const WorkspaceTriagePanel = lazy(() => import('@/features/ai-assistance').then((feature) => ({ default: feature.WorkspaceTriagePanel })));
const WorkspaceRagPanel = lazy(() => import('@/features/ai-assistance').then((feature) => ({ default: feature.WorkspaceRagPanel })));

interface WorkspaceAiPanelsProps {
  ticketId: string;
  onTicketChanged: () => void;
}

/**
 * The AI column of the agent workspace: triage suggestions, then the RAG evidence panel. The
 * evidence is for staff only; the route already admits only them, and the panel is checked again
 * here against the same role list, so it cannot appear anywhere else this is reused. Hiding is not
 * a security boundary: whatever the panel will read, the backend must authorise.
 */
export function WorkspaceAiPanels({ ticketId, onTicketChanged }: WorkspaceAiPanelsProps) {
  const { user } = useAuth();
  const showEvidence = hasAnyRole(user?.roles ?? [], routes.workspaceTicket.roles);
  return (
    <Suspense fallback={null}>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <WorkspaceTriagePanel ticketId={ticketId} onTicketChanged={onTicketChanged} />
        {showEvidence && <WorkspaceRagPanel ticketId={ticketId} />}
      </Space>
    </Suspense>
  );
}
