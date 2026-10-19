import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useCreateTicket } from '../hooks/useCreateTicket';
import { CreateTicketForm } from '../components/CreateTicketForm';

export function CreateTicketPage() {
  const create = useCreateTicket();
  const navigate = useNavigate();
  return <Card>
    <Typography.Title level={2}>Gửi yêu cầu IT mới</Typography.Title>
    {create.error && <ErrorState error={create.error} />}
    <CreateTicketForm pending={create.isPending} onCancel={() => navigate('/requester-dashboard/tickets')}
      onSubmit={async (payload) => {
        try { const ticket = await create.mutateAsync(payload); navigate(`/requester-dashboard/tickets/${ticket.id}`); }
        catch { /* The mutation error is rendered above. */ }
      }} />
  </Card>;
}
