import { Result, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { normalizeError } from '@/shared/api/httpError';
import { ErrorState } from '@/shared/ui/ErrorState';

interface TicketErrorStateProps {
  error: unknown;
  backPath: string;
  backLabel: string;
  onRetry: () => void;
}

/** Full-page state when the ticket cannot be shown: missing, forbidden or failed to load. */
export function TicketErrorState({ error, backPath, backLabel, onRetry }: TicketErrorStateProps) {
  const back = <Link to={backPath}><ArrowLeftOutlined /> {backLabel}</Link>;
  const status = error === null ? 404 : normalizeError(error).status;
  if (status === 404) {
    return <Result status="404" title="Không tìm thấy ticket" subTitle="Ticket không tồn tại hoặc nằm ngoài phạm vi của bạn." extra={back} />;
  }
  if (status === 403) {
    return <Result status="403" title="Bạn không có quyền xem ticket này" extra={back} />;
  }
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <ErrorState error={error} onRetry={onRetry} />
      {back}
    </Space>
  );
}
