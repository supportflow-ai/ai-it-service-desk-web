import { Alert, Card, Space, Tag, Typography } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import type { RagSourceAdapter, RagSuggestionView } from '../model/rag.types';
import { formatGeneratedAt } from '../model/ragDisplay';
import { ConfidenceTag } from './ConfidenceTag';
import { RagCitationList } from './RagCitationList';
import { ReviewHintTag } from './ReviewHintTag';

interface Props {
  /** null means no RAG result is available for this ticket (not enabled). */
  result: RagSuggestionView | null;
  sources?: RagSourceAdapter;
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
 * What an agent sees of a RAG suggestion (TC-384, TC-385): the suggested reply with the model and
 * confidence behind it, and the sources it rests on. It only shows; the agent writes and sends the
 * reply (auto-send is out of scope), and the ticket never waits on it (PRD UX-06).
 */
export function RagEvidencePanel({ result, sources }: Props) {
  if (!result) {
    return <Card size="small" title={title}>
      <Alert type="info" showIcon message="Gợi ý trả lời từ tri thức chưa được bật cho ticket này."
        description="Bạn vẫn xử lý ticket như bình thường." />
    </Card>;
  }
  const answer = result.outcome === 'Answered' ? result.answer?.trim() ?? '' : '';
  if (answer === '') {
    return <Card size="small" title={title}>
      <Alert type="info" showIcon message="Chưa có gợi ý trả lời cho ticket này." />
    </Card>;
  }
  const cited = result.citations.length > 0;
  return <Card size="small" title={title} extra={cited && <Tag color="green" style={{ margin: 0 }}>Có nguồn</Tag>}>
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <AnswerMeta view={result} />
      {/* Plain text: the answer is model output and never goes through a Markdown or HTML renderer. */}
      <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{answer}</Typography.Paragraph>
      {cited && <RagCitationList citations={result.citations} sources={sources} />}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        AI chỉ gợi ý và không tự gửi cho người yêu cầu.{cited && ' Hãy mở nguồn để kiểm tra trước khi dùng.'}
      </Typography.Text>
    </Space>
  </Card>;
}
