import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Card, Input, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EditOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { TicketCategory, ticketCategoryLabels } from '@/features/tickets';
import type { ConfidenceBand, SuggestionDecision, SuggestionDto } from '../model/ai.types';
import {
  OVERRIDE_REASON_MAX_LENGTH,
  decisionSummary,
  levelOptions,
  suggestionDecisionLabels,
  suggestionTypeLabels,
  validateOverride,
} from '../model/suggestionDecision';
import type { DecisionHandler } from '../hooks/useSuggestionDecision';
import { ConfidenceTag } from './ConfidenceTag';
import { ReviewHintTag } from './ReviewHintTag';

// An icon beside each status, so it does not rest on colour alone.
const decisionIcons: Record<SuggestionDecision, ReactNode> = {
  Pending: <ClockCircleOutlined />,
  Accepted: <CheckCircleOutlined />,
  Overridden: <EditOutlined />,
  Rejected: <CloseCircleOutlined />,
  Expired: <FieldTimeOutlined />,
};

function formatReviewedAt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const categoryOptions = Object.values(TicketCategory).map((value) => ({ value, label: ticketCategoryLabels[value] }));

function valueLabel(suggestion: SuggestionDto, value: string) {
  const options = suggestion.type === 'Category' ? categoryOptions : levelOptions;
  return options.find((option) => option.value === value)?.label ?? value;
}

interface SuggestionReviewCardProps {
  suggestion: SuggestionDto;
  confidence?: ConfidenceBand | null;
  revision: number | null;
  enabled: boolean;
  pending: boolean;
  onDecision: DecisionHandler;
}

export function SuggestionReviewCard({ suggestion, confidence = null, revision, enabled, pending, onDecision }: SuggestionReviewCardProps) {
  const [overriding, setOverriding] = useState(false);
  const [finalValue, setFinalValue] = useState('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const decided = suggestion.decision !== 'Pending';
  const disabled = !enabled || pending || decided || revision === null;
  const overrideError = validateOverride(suggestion.suggestedValue, finalValue, reason);
  const options = (suggestion.type === 'Category' ? categoryOptions : levelOptions)
    .filter((option) => option.value !== suggestion.suggestedValue);
  const decisionMeta = suggestionDecisionLabels[suggestion.decision];
  const suggestedLabel = valueLabel(suggestion, suggestion.suggestedValue);
  // The AI value did not end up on the ticket: shown struck through.
  const setAside = suggestion.decision === 'Overridden' || suggestion.decision === 'Rejected' || suggestion.decision === 'Expired';

  const decide = async (decision: 'Accepted' | 'Rejected' | 'Overridden') => {
    if (disabled || revision === null) return;
    if (decision === 'Overridden' && overrideError) { setTouched(true); return; }
    try {
      await onDecision(suggestion.id, {
        decision,
        ticketRevision: revision,
        ...(decision === 'Overridden' ? { finalValue, reason: reason.trim() } : {}),
      });
      setOverriding(false); setFinalValue(''); setReason(''); setTouched(false);
    } catch { /* The panel renders the error; inputs stay so the agent can retry. */ }
  };

  return <Card size="small">
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text strong>{suggestionTypeLabels[suggestion.type]}</Typography.Text>
        <Tag color={decisionMeta.color} icon={decisionIcons[suggestion.decision]}>{decisionMeta.label}</Tag>
      </Space>
      <span>
        Gợi ý: <Tag style={setAside ? { textDecoration: 'line-through' } : undefined}>{suggestedLabel}</Tag>
        <ConfidenceTag band={confidence} score={suggestion.modelScore} />
        {!decided && <ReviewHintTag band={confidence} />}
      </span>
      {suggestion.finalValue && <span>Giá trị cuối: <Tag color="green">{valueLabel(suggestion, suggestion.finalValue)}</Tag></span>}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {decisionSummary(suggestion.decision, suggestedLabel, suggestion.finalValue && valueLabel(suggestion, suggestion.finalValue))}
        {suggestion.reviewedAt && ` Lúc ${formatReviewedAt(suggestion.reviewedAt)}.`}
      </Typography.Text>

      {!decided && <Space wrap>
        <Button type="primary" disabled={disabled} loading={pending} onClick={() => { void decide('Accepted'); }}>Chấp nhận</Button>
        <Button disabled={disabled} onClick={() => { setOverriding(true); setTouched(false); }}>Chọn giá trị khác</Button>
        <Popconfirm title="Từ chối gợi ý này?" description="Không giá trị nào từ AI được áp dụng." okText="Xác nhận từ chối"
          cancelText="Không" disabled={disabled} onConfirm={() => { void decide('Rejected'); }}>
          <Button danger disabled={disabled}>Từ chối</Button>
        </Popconfirm>
      </Space>}

      {overriding && !decided && <Space direction="vertical" style={{ width: '100%' }}>
        <Select aria-label="Giá trị thay thế" placeholder="Chọn giá trị thay thế" virtual={false} disabled={disabled}
          value={finalValue || undefined} options={options} onChange={setFinalValue} style={{ width: '100%' }} />
        <Input.TextArea aria-label="Lý do điều chỉnh" placeholder="Vì sao giá trị gợi ý chưa đúng?" rows={2}
          maxLength={OVERRIDE_REASON_MAX_LENGTH} showCount disabled={disabled} value={reason} onChange={(event) => setReason(event.target.value)} />
        {touched && overrideError && <Typography.Text type="danger" style={{ fontSize: 12 }}>{overrideError}</Typography.Text>}
        <Space>
          <Button type="primary" disabled={disabled} loading={pending} onClick={() => { void decide('Overridden'); }}>Áp dụng</Button>
          <Button disabled={pending} onClick={() => { setOverriding(false); setFinalValue(''); setReason(''); setTouched(false); }}>Hủy</Button>
        </Space>
      </Space>}
    </Space>
  </Card>;
}
