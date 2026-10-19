import { Alert, Button, Space } from 'antd';
import { normalizeError } from '../api/httpError';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const normalized = normalizeError(error);
  if (normalized.kind === 'canceled') return null;
  return <Space direction="vertical" style={{ width: '100%' }}>
    <Alert type="error" showIcon message={normalized.message} />
    {onRetry && <Button onClick={onRetry}>Thử lại</Button>}
  </Space>;
}
