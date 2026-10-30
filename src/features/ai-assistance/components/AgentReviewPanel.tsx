import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { ticketCategoryLabels } from '@/features/tickets';
import { ErrorState } from '@/shared/ui/ErrorState';
import type { AgentTriageView, ConfidenceBand, SuggestionDto, SuggestionType } from '../model/ai.types';
import { reviewBlockReason } from '../model/reviewEligibility';
import { impactLabels, needsReview, triageOutcomeMessages, urgencyLabels } from '../model/triageDisplay';
import { useSuggestionDecision } from '../hooks/useSuggestionDecision';
import type { DecisionHandler } from '../hooks/useSuggestionDecision';
import { ConfidenceTag } from './ConfidenceTag';
import { SuggestionReviewCard } from './SuggestionReviewCard';

interface Props {
  /** null means no triage result is available for this ticket (AI not enabled). */
  result: AgentTriageView | null;
  ticketRevision: number | null;
  suggestions?: SuggestionDto[];
  loading?: boolean;
  stale?: boolean;
  onDecision?: DecisionHandler;
  onReanalyze?: () => void;
  /** Called after a decision is recorded, so the host can refetch the ticket. */
  onDecided?: () => void;
}

const title = <Space size={6}><RobotOutlined style={{ color: 'var(--pr)' }} />Gợi ý AI</Space>;

function SuggestionRow({ label, value, band, score }: {
  label: string; value: string | null; band: ConfidenceBand | null; score: number | null;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 0', borderBottom: '1px solid var(--bd)' }}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Space size={4} wrap>
        {value === null ? <Typography.Text type="secondary">Không có gợi ý</Typography.Text> : <strong>{value}</strong>}
        <ConfidenceTag band={band} score={score} />
        {value !== null && needsReview(band) && <Tag color="warning">Cần xem xét</Tag>}
      </Space>
    </div>
  );
}

export function AgentReviewPanel({ result, ticketRevision, suggestions = [], loading, stale = false, onDecision, onReanalyze, onDecided }: Props) {
  const decision = useSuggestionDecision(onDecision, onDecided);
  if (loading) return <Card title={title} loading />;
  if (!result) {
    return <Card title={title}>
      <Alert type="info" showIcon message="Gợi ý AI chưa được bật cho ticket này."
        description="Bạn vẫn phân loại và xử lý thủ công như bình thường." />
    </Card>;
  }
  if (result.outcome !== 'Success') {
    return <Card title={title}>
      <Alert type="warning" showIcon message={triageOutcomeMessages[result.outcome]}
        description="Không có gợi ý cho ticket này; xử lý thủ công vẫn hoạt động bình thường." />
    </Card>;
  }
  const blockReason = reviewBlockReason(ticketRevision, stale, result.requiresManualTriage, !!onDecision);
  const confidenceByType: Record<SuggestionType, ConfidenceBand | null> = {
    Category: result.categoryConfidence,
    Impact: result.impactConfidence,
    Urgency: result.urgencyConfidence,
  };
  return <Card title={title} extra={stale && <Tag color="red">Gợi ý cũ</Tag>}>
    <Space direction="vertical" style={{ width: '100%' }}>
      {result.requiresManualTriage && <Alert type="warning" showIcon message="Cần phân loại thủ công"
        description="Ticket thuộc nhóm phải do người xem xét (ví dụ sự cố bảo mật); không áp dụng gợi ý AI." />}
      {stale && <Alert type="warning" showIcon
        message="Nội dung ticket đã thay đổi sau khi AI phân tích; gợi ý có thể không còn đúng."
        action={onReanalyze && <Button size="small" onClick={onReanalyze}>Phân tích lại</Button>} />}
      <div>
        <SuggestionRow label="Danh mục" value={result.suggestedCategory ? ticketCategoryLabels[result.suggestedCategory] : null}
          band={result.categoryConfidence} score={result.categoryScore} />
        <SuggestionRow label="Mức ảnh hưởng" value={result.suggestedImpact ? impactLabels[result.suggestedImpact] : null}
          band={result.impactConfidence} score={result.impactScore} />
        <SuggestionRow label="Mức khẩn cấp" value={result.suggestedUrgency ? urgencyLabels[result.suggestedUrgency] : null}
          band={result.urgencyConfidence} score={result.urgencyScore} />
      </div>
      {result.validationErrors.length > 0 && <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Một số gợi ý không hợp lệ đã bị loại bỏ.
      </Typography.Text>}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        AI chỉ gợi ý; quyết định cuối cùng thuộc về kỹ thuật viên.
      </Typography.Text>
      {blockReason && suggestions.length > 0 && <Alert type="warning" showIcon message={blockReason} />}
      {decision.error && <ErrorState error={decision.error} />}
      {suggestions.map((suggestion) => <SuggestionReviewCard key={suggestion.id} suggestion={suggestion}
        confidence={confidenceByType[suggestion.type]}
        revision={ticketRevision} enabled={blockReason === null} pending={decision.isPending}
        onDecision={(id, request) => decision.mutateAsync({ id, request })} />)}
    </Space>
  </Card>;
}
