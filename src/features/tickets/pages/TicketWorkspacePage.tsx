import { Col, Result, Row, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useTicket } from '../hooks/useTicket';
import { queueReturnPath } from '../lib/agentQueueSearch';
import { isTicketId } from '../model/ticketId';
import { TicketWorkspaceHeader } from '../components/TicketWorkspaceHeader';
import { TicketWorkspaceSidebar } from '../components/TicketWorkspaceSidebar';
import { TicketAssignmentPanel } from '../components/TicketAssignmentPanel';
import { TicketWorkspaceAI } from '../components/TicketWorkspaceAI';
import { TicketTimeline } from '../components/TicketTimeline';
import { TicketCommentComposer } from '../components/TicketCommentComposer';
import { TicketCommandPanel } from '../components/TicketCommandPanel';
import { TicketAttachmentSection } from '../components/TicketAttachmentSection';

export function TicketWorkspacePage() {
  const { id } = useParams();
  const location = useLocation();
  const ticket = useTicket(id ?? '');

  if (!isTicketId(id)) return <Result status="404" title="Không tìm thấy ticket" />;
  if (ticket.isPending) return <PageLoader />;
  if (!ticket.data) return <ErrorState error={ticket.error} onRetry={() => { void ticket.refetch(); }} />;
  const reload = () => { void ticket.refetch(); };

  return (
    <div style={{ maxWidth: 1380, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        {/* Returns to the queue with the filters the agent left it with. */}
        <Link to={queueReturnPath(location.state)} style={{ fontWeight: 500 }}>
          <ArrowLeftOutlined /> Quay lại hàng đợi
        </Link>
      </div>

      {ticket.error && (
        <div style={{ marginBottom: 16 }}>
          <ErrorState error={ticket.error} onRetry={reload} />
        </div>
      )}

      <Row gutter={[20, 20]} align="top">
        {/* Who and what: metadata the agent needs before acting. */}
        <Col xs={24} md={8} lg={6} xl={5}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <TicketWorkspaceSidebar ticket={ticket.data} />
            <TicketAssignmentPanel ticket={ticket.data} onReload={reload} />
          </Space>
        </Col>

        {/* The ticket itself, then actions, then the conversation. */}
        <Col xs={24} md={16} lg={18} xl={13}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <TicketWorkspaceHeader ticket={ticket.data} />
            <TicketCommandPanel ticket={ticket.data} onReload={reload} />
            <TicketTimeline ticketId={ticket.data.id} />
            <TicketCommentComposer key={`composer-${ticket.data.id}`} ticketId={ticket.data.id} />
            <TicketAttachmentSection key={ticket.data.id} ticketId={ticket.data.id} />
          </Space>
        </Col>

        <Col xs={24} xl={6}>
          <TicketWorkspaceAI />
        </Col>
      </Row>
    </div>
  );
}
