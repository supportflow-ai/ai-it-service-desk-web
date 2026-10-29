import { Button, Card, Col, Result, Row, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useTicket } from '../hooks/useTicket';
import { useTicketCommands } from '../hooks/useTicketCommands';
import { isTicketId } from '../model/ticketId';
import { TicketWorkspaceSidebar } from '../components/TicketWorkspaceSidebar';
import { TicketWorkspaceAI } from '../components/TicketWorkspaceAI';
import { TicketTimeline } from '../components/TicketTimeline';
import { TicketCommentComposer } from '../components/TicketCommentComposer';
import { TicketCommandPanel } from '../components/TicketCommandPanel';
import { TicketAttachmentSection } from '../components/TicketAttachmentSection';

const { Title, Paragraph } = Typography;

export function TicketWorkspacePage() {
  const { id } = useParams();
  const ticket = useTicket(id ?? '');
  const commands = useTicketCommands(id ?? '');

  if (!isTicketId(id)) return <Result status="404" title="Không tìm thấy ticket" />;
  if (ticket.isPending) return <PageLoader />;
  if (!ticket.data) return <ErrorState error={ticket.error} onRetry={() => { void ticket.refetch(); }} />;

  return (
    <div style={{ maxWidth: 1380, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/agent-workspace">
          <Button icon={<ArrowLeftOutlined />} type="link" style={{ padding: 0, fontWeight: 500 }}>
            Quay lại hàng đợi
          </Button>
        </Link>
      </div>

      {ticket.error && (
        <div style={{ marginBottom: 16 }}>
          <ErrorState error={ticket.error} onRetry={() => { void ticket.refetch(); }} />
        </div>
      )}

      {/* 3 Columns Layout */}
      <Row gutter={[20, 20]} align="top">
        {/* Column 1: Context Metadata */}
        <Col xs={24} md={6} lg={5}>
          <TicketWorkspaceSidebar ticket={ticket.data} />
        </Col>

        {/* Column 2: Main Processing Workbench */}
        <Col xs={24} md={12} lg={13}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card
              bordered
              style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>
                  {ticket.data.title}
                </Title>
              </div>

              <Paragraph style={{ margin: '14px 0 0 0', color: 'var(--tx2)', fontSize: 14, lineHeight: 1.6 }}>
                {ticket.data.description}
              </Paragraph>
            </Card>

            <TicketCommandPanel ticket={ticket.data} commands={commands} />

            <TicketAttachmentSection ticketId={ticket.data.id} />

            <TicketTimeline ticketId={ticket.data.id} />

            <TicketCommentComposer ticketId={ticket.data.id} />
          </Space>
        </Col>

        {/* Column 3: AI Assistant */}
        <Col xs={24} md={6} lg={6}>
          <TicketWorkspaceAI />
        </Col>
      </Row>
    </div>
  );
}
