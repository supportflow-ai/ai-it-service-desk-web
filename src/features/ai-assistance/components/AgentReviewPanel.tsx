import { Alert, Button, Card, Descriptions, Space, Tag } from 'antd';
import { ErrorState } from '@/shared/ui/ErrorState';
import type { AgentTriageView, SuggestionDto } from '../model/ai.types';
import { canReviewSuggestion } from '../model/reviewEligibility';
import { useSuggestionDecision } from '../hooks/useSuggestionDecision';
import type { DecisionHandler } from '../hooks/useSuggestionDecision';
import { ConfidenceTag } from './ConfidenceTag';
import { SuggestionReviewCard } from './SuggestionReviewCard';

interface Props {
  result: AgentTriageView | null;
  ticketRevision: number | null;
  suggestions?: SuggestionDto[];
  loading?: boolean;
  stale?: boolean;
  onDecision?: DecisionHandler;
  onReanalyze?: () => void;
}

export function AgentReviewPanel({ result, ticketRevision, suggestions = [], loading, stale = false, onDecision, onReanalyze }: Props) {
  const decision = useSuggestionDecision(onDecision);
  if (loading) return <Card title="AI Triage Review" loading />;
  if (!result || result.outcome !== 'Success') return <Card title="AI Triage Review">
    <Alert type="info" message="AI assistance is currently unavailable. Manual processing remains available." />
  </Card>;
  const enabled = canReviewSuggestion(ticketRevision, stale, result.requiresManualTriage, !!onDecision);
  return <Card title="AI Triage Suggestions" extra={stale && <Tag color="red">Stale</Tag>}>
    <Space direction="vertical" style={{ width: '100%' }}>
      {!enabled && <Alert type="warning" message="Suggestions cannot be applied: review requires a current revision and an available review action; stale or manual-only suggestions must be reviewed manually." />}
      {stale && onReanalyze && <Button onClick={onReanalyze}>Re-analyze</Button>}
      <Descriptions column={1} bordered items={[
        { key: 'category', label: 'Category', children: <>{result.suggestedCategory ?? '—'} <ConfidenceTag band={result.categoryConfidence} score={result.categoryScore} /></> },
        { key: 'impact', label: 'Impact', children: <>{result.suggestedImpact ?? '—'} <ConfidenceTag band={result.impactConfidence} score={result.impactScore} /></> },
        { key: 'urgency', label: 'Urgency', children: <>{result.suggestedUrgency ?? '—'} <ConfidenceTag band={result.urgencyConfidence} score={result.urgencyScore} /></> },
      ]} />
      {decision.error && <ErrorState error={decision.error} />}
      {suggestions.map((suggestion) => <SuggestionReviewCard key={suggestion.id} suggestion={suggestion}
        revision={ticketRevision} enabled={enabled} pending={decision.isPending}
        onDecision={(id, request) => decision.mutateAsync({ id, request })} />)}
    </Space>
  </Card>;
}
