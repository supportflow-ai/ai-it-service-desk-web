import { Card, Result, Space } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useTicket } from '../hooks/useTicket';
import { isTicketId } from '../model/ticketId';
import { TicketHeader } from '../components/TicketHeader';
import { TicketMetadata } from '../components/TicketMetadata';
import { TicketTimeline } from '../components/TicketTimeline';
import { TicketCommentComposer } from '../components/TicketCommentComposer';

export function TicketDetailPage() {
  const { id } = useParams();
  const ticket = useTicket(id ?? '');
  if (!isTicketId(id)) return <Result status="404" title="Không tìm thấy ticket" />;
  if (ticket.isPending) return <PageLoader />;
  if (!ticket.data) return <ErrorState error={ticket.error} onRetry={() => { void ticket.refetch(); }} />;
  return <Space direction="vertical" style={{ width: '100%' }} size={16}>
    <Card>
      <Link to="/requester-dashboard/tickets">Quay lại danh sách</Link>
      {ticket.error && <ErrorState error={ticket.error} onRetry={() => { void ticket.refetch(); }} />}
      <TicketHeader ticket={ticket.data} /><TicketMetadata ticket={ticket.data} />
    </Card>
    <TicketTimeline ticketId={ticket.data.id} />
    <TicketCommentComposer key={`composer-${ticket.data.id}`} ticketId={ticket.data.id} />
  </Space>;
}
