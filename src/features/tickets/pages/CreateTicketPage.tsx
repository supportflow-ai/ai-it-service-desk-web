import type { ReactNode } from 'react';
import { Card, Col, Form, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useCreateTicket } from '../hooks/useCreateTicket';
import { CreateTicketForm } from '../components/CreateTicketForm';
import type { CreateTicketPayload } from '../model/ticket.types';

const { Title } = Typography;

interface CreateTicketPageProps {
  /** Composed by the App: tickets must not depend on ai-assistance, so the AI side panel is injected. */
  aiPanel?: ReactNode;
}

export function CreateTicketPage({ aiPanel }: CreateTicketPageProps = {}) {
  const [form] = Form.useForm<CreateTicketPayload>();
  const create = useCreateTicket();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2} style={{ margin: '0 0 20px', fontWeight: 700 }}>
        Tạo yêu cầu
      </Title>

      {create.error && <ErrorState error={create.error} />}

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} lg={aiPanel ? 15 : 24}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: 'var(--bd)',
              background: 'var(--sf)',
            }}
          >
            <CreateTicketForm
              form={form}
              pending={create.isPending}
              onCancel={() => navigate('/requester-dashboard/tickets')}
              onSubmit={async (payload) => {
                try {
                  const ticket = await create.mutateAsync(payload);
                  navigate(`/requester-dashboard/tickets/${ticket.id}`);
                } catch {
                  /* The mutation error is rendered above. */
                }
              }}
            />
          </Card>
        </Col>

        {/* AI is side assistance (PRD UX-02): submitting never depends on it. */}
        {aiPanel && <Col xs={24} lg={9}>{aiPanel}</Col>}
      </Row>
    </div>
  );
}
