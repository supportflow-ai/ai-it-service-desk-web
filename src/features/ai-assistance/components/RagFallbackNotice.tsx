import { Alert, Button, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import type { RagPanelState } from '../model/ragDisplay';
import { ragNoEvidenceMessages, ragUnavailableMessages } from '../model/ragDisplay';

interface Props {
  state: Exclude<RagPanelState, { kind: 'answer' }>;
  /** Where the agent can search the knowledge base by hand. */
  knowledgeSearchPath?: string;
  /** Asks the AI again; offered only when the host can really run it. */
  onRetry?: () => void;
}

/**
 * The ways the panel has no answer (TC-386), each worded differently so an agent can tell them
 * apart: not enabled, running, AI unavailable, and no evidence. None of them blocks the ticket.
 */
export function RagFallbackNotice({ state, knowledgeSearchPath, onRetry }: Props) {
  switch (state.kind) {
    case 'not-enabled':
      return <Alert type="info" showIcon message="Gợi ý trả lời từ tri thức chưa được bật cho ticket này."
        description="Bạn vẫn xử lý ticket như bình thường." />;
    case 'loading':
      return (
        <div role="status" aria-live="polite">
          <span className="meta">AI đang tìm bằng chứng trong Kho tri thức…</span>
          <Skeleton active paragraph={{ rows: 3 }} title={false} style={{ marginTop: 8 }} />
        </div>
      );
    case 'unavailable':
      return <Alert type="warning" showIcon message={ragUnavailableMessages[state.reason]}
        description="Không có gợi ý lúc này; xử lý thủ công vẫn hoạt động bình thường."
        action={onRetry && <Button size="small" onClick={onRetry}>Thử lại</Button>} />;
    case 'no-evidence': {
      const text = ragNoEvidenceMessages[state.reason];
      return <Alert type="info" showIcon message={text.message} description={
        <>
          {text.description}
          {knowledgeSearchPath && <> <Link to={knowledgeSearchPath}>Tìm trong Kho tri thức</Link></>}
        </>
      } />;
    }
  }
}
