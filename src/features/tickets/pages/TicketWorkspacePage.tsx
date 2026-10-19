import { Card, Col, Result, Row, Space } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useTicket } from '../hooks/useTicket';
import { useTicketCommands } from '../hooks/useTicketCommands';
import { isTicketId } from '../model/ticketId';
import { TicketHeader } from '../components/TicketHeader';
import { TicketMetadata } from '../components/TicketMetadata';
import { TicketTimeline } from '../components/TicketTimeline';
import { TicketCommentComposer } from '../components/TicketCommentComposer';
import { TicketCommandPanel } from '../components/TicketCommandPanel';

export function TicketWorkspacePage() {
  const { id } = useParams();
  const ticket = useTicket(id ?? '');
  const commands = useTicketCommands(id ?? '');
  if (!isTicketId(id)) return <Result status="404" title="Không tìm thấy ticket" />;
  if (ticket.isPending) return <PageLoader />;
  if (!ticket.data) return <ErrorState error={ticket.error} onRetry={() => { void ticket.refetch(); }} />;
  return <Space direction="vertical" style={{ width: '100%' }}>
    <Link to="/agent-workspace">Quay lại hàng đợi</Link>
    {ticket.error && <ErrorState error={ticket.error} onRetry={() => { void ticket.refetch(); }} />}
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}><Space direction="vertical" style={{ width: '100%' }}>
        <Card><TicketHeader ticket={ticket.data} /><TicketMetadata ticket={ticket.data} /></Card>
        <TicketTimeline /><TicketCommentComposer />
      </Space></Col>
      <Col xs={24} lg={8}><TicketCommandPanel commands={commands} /></Col>
    </Row>
  </Space>;
}
