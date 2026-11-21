import { Card, Space, Tag, Typography } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import type { RagSourceAdapter, RagSuggestionView } from '../model/rag.types';
import { formatGeneratedAt, ragPanelState } from '../model/ragDisplay';
import { ConfidenceTag } from './ConfidenceTag';
import { RagCitationList } from './RagCitationList';
import { RagFallbackNotice } from './RagFallbackNotice';
import { ReviewHintTag } from './ReviewHintTag';

interface Props {
  /** null means no RAG result is available for this ticket (not enabled). */
  result: RagSuggestionView | null;
  loading?: boolean;
  sources?: RagSourceAdapter;
  knowledgeSearchPath?: string;
  onRetry?: () => void;
}

const title = <Space size={6}><BookOutlined style={{ color: 'var(--pr)' }} />Gợi ý từ Kho tri thức</Space>;

function AnswerMeta({ view }: { view: RagSuggestionView }) {
  return (
    <Space size={[6, 6]} wrap>
      {view.model && <Tag style={{ margin: 0 }}>Mô hình: {view.model}</Tag>}
      <ConfidenceTag band={view.confidence} score={view.score} />
      <ReviewHintTag band={view.confidence} />
      {view.generatedAt && <span className="meta">Tạo lúc {formatGeneratedAt(view.generatedAt)}</span>}
    </Space>
  );
}

/**
 * What an agent sees of a RAG suggestion (TC-384, TC-385, TC-386): the suggested reply with the
 * model and confidence behind it, the sources it rests on, and a distinct state for each way
 * there is no answer. It only shows; the agent writes and sends the reply (auto-send is out of
 * scope), and the ticket never waits on it (PRD UX-06).
 */
export function RagEvidencePanel({ result, loading = false, sources, knowledgeSearchPath, onRetry }: Props) {
  const state = ragPanelState(result, loading);
  if (state.kind !== 'answer') {
    return <Card size="small" title={title}>
      <RagFallbackNotice state={state} knowledgeSearchPath={knowledgeSearchPath} onRetry={onRetry} />
    </Card>;
  }
  return <Card size="small" title={title} extra={<Tag color="green" style={{ margin: 0 }}>Có nguồn</Tag>}>
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <AnswerMeta view={state.view} />
      {/* Plain text: the answer is model output and never goes through a Markdown or HTML renderer. */}
      <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{state.answer}</Typography.Paragraph>
      <RagCitationList citations={state.citations} sources={sources} />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        AI chỉ gợi ý và không tự gửi cho người yêu cầu. Hãy mở nguồn để kiểm tra trước khi dùng.
      </Typography.Text>
    </Space>
  </Card>;
}
