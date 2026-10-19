import { useState } from 'react';
import { Button, Card, Input, Select, Space, Tag, Typography } from 'antd';
import { TicketCategory } from '@/features/tickets';
import type { SuggestionDto } from '../model/ai.types';
import type { DecisionHandler } from '../hooks/useSuggestionDecision';

export function SuggestionReviewCard({ suggestion, revision, enabled, pending, onDecision }: {
  suggestion: SuggestionDto; revision: number | null; enabled: boolean; pending: boolean; onDecision: DecisionHandler;
}) {
  const [override, setOverride] = useState(false);
  const [value, setValue] = useState('');
  const disabled = !enabled || pending || suggestion.decision !== 'Pending';
  const decide = async (decision: 'Accepted' | 'Rejected' | 'Overridden') => {
    if (disabled || revision === null || (decision === 'Overridden' && !value.trim())) return;
    try {
      await onDecision(suggestion.id, { decision, ticketRevision: revision, ...(decision === 'Overridden' ? { finalValue: value.trim() } : {}) });
      setOverride(false); setValue('');
    } catch { /* Parent mutation renders the error; preserve override input for retry. */ }
  };
  return <Card size="small">
    <Space direction="vertical">
      <Typography.Text strong>{suggestion.type}</Typography.Text>
      <span>Suggested: <Tag>{suggestion.suggestedValue}</Tag></span>
      {suggestion.finalValue && <span>Final: <Tag color="green">{suggestion.finalValue}</Tag></span>}
      <Tag>{suggestion.decision}</Tag>
      <Space wrap>
        <Button disabled={disabled} loading={pending} onClick={() => { void decide('Accepted'); }}>Accept</Button>
        <Button disabled={disabled} onClick={() => { void decide('Rejected'); }}>Reject</Button>
        <Button disabled={disabled} onClick={() => { setOverride(true); setValue(''); }}>Override</Button>
      </Space>
      {override && <Space>
        {suggestion.type === 'Category'
          ? <Select aria-label="Final value" value={value || undefined} disabled={disabled} style={{ width: 140 }} onChange={setValue}
              options={Object.values(TicketCategory).map((category) => ({ label: category, value: category }))} />
          : <Input aria-label="Final value" disabled={disabled} value={value} onChange={(event) => setValue(event.target.value)} />}
        <Button disabled={disabled || !value.trim()} onClick={() => { void decide('Overridden'); }}>Apply</Button>
      </Space>}
    </Space>
  </Card>;
}
