import { Card, Space } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useTicket } from '../hooks/useTicket';
import { isAccessLostError } from '../lib/ticketErrorMessage';
import { isTicketId } from '../model/ticketId';
import { TicketHeader } from '../components/TicketHeader';
import { TicketMetadata } from '../components/TicketMetadata';
import { TicketCommandPanel } from '../components/TicketCommandPanel';
import { TicketAttachmentSection } from '../components/TicketAttachmentSection';
import { TicketTimeline } from '../components/TicketTimeline';
import { TicketCommentComposer } from '../components/TicketCommentComposer';
import { TicketErrorState } from '../components/TicketErrorState';

const listPath = '/requester-dashboard/tickets';

export function TicketDetailPage() {
  const { id } = useParams();
  const ticket = useTicket(id ?? '');
  const reload = () => { void ticket.refetch(); };
  if (!isTicketId(id)) return <TicketErrorState error={null} backPath={listPath} backLabel="Quay lại danh sách" onRetry={reload} />;
  if (ticket.isPending) return <PageLoader />;
  if (!ticket.data || isAccessLostError(ticket.error)) {
    return <TicketErrorState error={ticket.error} backPath={listPath} backLabel="Quay lại danh sách" onRetry={reload} />;
  }
  return <Space direction="vertical" style={{ width: '100%' }} size={16}>
    <Card>
      <div style={{ marginBottom: 8 }}><Link to={listPath}>Quay lại danh sách</Link></div>
      {ticket.error && <ErrorState error={ticket.error} onRetry={reload} />}
      <TicketHeader ticket={ticket.data} /><TicketMetadata ticket={ticket.data} />
    </Card>
    {/* The requester's own view (PRD US-021): owner commands and public data only, whoever is viewing. */}
    <TicketCommandPanel ticket={ticket.data} onReload={reload} view="requester" />
    <TicketAttachmentSection key={ticket.data.id} ticketId={ticket.data.id} status={ticket.data.status} />
    <TicketTimeline ticketId={ticket.data.id} view="requester" />
    <TicketCommentComposer key={`composer-${ticket.data.id}`} ticketId={ticket.data.id} status={ticket.data.status} view="requester" />
  </Space>;
}
