import { Space, Typography } from 'antd';
import type { TicketDto } from '../model/ticket.types';
import { TicketStatusTag } from './TicketStatusTag';

export function TicketHeader({ ticket }: { ticket: TicketDto }) {
  return <Space direction="vertical">
    <Typography.Text type="secondary">{ticket.ticketNumber}</Typography.Text>
    <Typography.Title level={2}>{ticket.title}</Typography.Title>
    <TicketStatusTag status={ticket.status} />
  </Space>;
}
