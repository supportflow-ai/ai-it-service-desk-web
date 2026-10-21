import { Card, Col, Form, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useCreateTicket } from '../hooks/useCreateTicket';
import { CreateTicketForm } from '../components/CreateTicketForm';
import { CreateTicketAIPanel } from '../components/CreateTicketAIPanel';
import type { CreateTicketPayload, TicketCategory } from '../model/ticket.types';

const { Title } = Typography;

export function CreateTicketPage() {
  const [form] = Form.useForm<CreateTicketPayload>();
  const create = useCreateTicket();
  const navigate = useNavigate();

  const handleApplyCategory = (category: TicketCategory) => {
    form.setFieldsValue({ categoryId: category });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2} style={{ margin: '0 0 20px', fontWeight: 700 }}>
        Tạo yêu cầu
      </Title>

      {create.error && <ErrorState error={create.error} />}

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} lg={15}>
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

        <Col xs={24} lg={9}>
          <CreateTicketAIPanel onApplyCategory={handleApplyCategory} />
        </Col>
      </Row>
    </div>
  );
}
