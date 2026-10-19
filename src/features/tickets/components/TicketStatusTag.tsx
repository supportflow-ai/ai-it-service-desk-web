import { Tag } from 'antd';
import type { TicketStatus } from '../model/ticket.types';
import { ticketStatusMeta } from '../model/ticketStatus';

export function TicketStatusTag({ status }: { status: TicketStatus }) {
  const meta = ticketStatusMeta[status];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}
