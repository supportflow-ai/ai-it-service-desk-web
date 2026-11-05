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
  // A ticket that is missing and one the viewer may not see look the same, so the page does not
  // reveal that a ticket outside their scope exists (PRD UX-04).
  if (status === 404 || status === 403) {
    return <Result status="404" title="Không tìm thấy ticket" subTitle="Ticket không tồn tại hoặc bạn không có quyền xem." extra={back} />;
  }
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <ErrorState error={error} onRetry={onRetry} />
      {back}
    </Space>
  );
}
