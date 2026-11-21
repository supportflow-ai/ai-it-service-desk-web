import { Alert, Button, Card, Empty, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, RobotOutlined, WarningOutlined } from '@ant-design/icons';
import type { TicketCategory } from '@/features/tickets';
import { ticketCategoryLabels } from '@/features/tickets';
import type { RequesterTriageView } from '../model/ai.types';
import { TriageOutcome } from '../model/ai.types';
import { needsReview } from '../model/triageDisplay';
import { ConfidenceTag } from './ConfidenceTag';

const { Text } = Typography;

interface Props {
  result: RequesterTriageView | null;
  loading?: boolean;
  selectedCategory?: string;
  onApplyCategory?: (category: TicketCategory) => void;
}

const title = <Space size={6}><RobotOutlined style={{ color: 'var(--pr)' }} />Gợi ý AI</Space>;

/**
 * Requester-safe AI suggestion panel.
 * Shows ONLY category suggestion + confidence band.
 * Does NOT show: Impact, Urgency, raw scores, historical tickets, internal notes.
 *
 * Submit is NEVER disabled by AI unavailability (PRD UX-06).
 */
export function RequesterAIPanel({ result, loading, selectedCategory, onApplyCategory }: Props) {
  if (loading) {
    return <Card size="small" title={title} loading />;
  }

  if (!result) {
    return (
      <Card size="small" title={title}>
        <Empty
          description="Gợi ý AI chưa được bật. Bạn vẫn có thể gửi yêu cầu bình thường."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  // Fallback states — AI unavailable/timeout/error
  if (result.outcome !== TriageOutcome.Success) {
    return (
      <Card size="small" title={title}>
        <Alert type="info" showIcon message="Gợi ý AI tạm thời không khả dụng. Bạn vẫn có thể tiếp tục gửi yêu cầu." />
      </Card>
    );
  }

  return (
    <Card size="small" title={title}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {result.requiresManualTriage && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="Có thể là sự cố bảo mật: kỹ thuật viên sẽ phân loại thủ công."
          />
        )}

        {result.suggestedCategory && (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">Danh mục gợi ý: </Text>
              <Tag color="processing">{ticketCategoryLabels[result.suggestedCategory]}</Tag>
              <ConfidenceTag band={result.categoryConfidence} />
            </div>
            {/* Requester-safe: a band, never the score (TriageViewProjections). */}
            {needsReview(result.categoryConfidence) && (
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  AI chưa chắc chắn về danh mục này; kỹ thuật viên sẽ kiểm tra lại.
                </Text>
              </div>
            )}
            {onApplyCategory && (
              <div style={{ marginTop: 8 }}>
                {selectedCategory === result.suggestedCategory ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>Đã chọn danh mục này</Tag>
                ) : (
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={() => onApplyCategory(result.suggestedCategory!)}
                  >
                    Áp dụng danh mục này
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <Text type="secondary" style={{ fontSize: 12 }}>
          Đây chỉ là gợi ý của AI. Kỹ thuật viên sẽ xem xét và chốt danh mục.
        </Text>
      </Space>
    </Card>
  );
}
