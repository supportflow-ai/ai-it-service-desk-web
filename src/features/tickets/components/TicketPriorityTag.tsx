import { Typography } from 'antd';
import type { TicketPriority } from '../model/ticket.types';
import { ticketPriorityLabels } from '../model/ticketPriority';

const priorityClass: Record<TicketPriority, string> = { P1: 'er', P2: 'wn', P3: 'in', P4: '' };

export function TicketPriorityTag({ priority }: { priority: TicketPriority | null | undefined }) {
  if (!priority) return <Typography.Text type="secondary">Chưa có</Typography.Text>;
  return (
    <span className={`status-tag ${priorityClass[priority]}`} style={{ verticalAlign: 'middle' }}>
      {ticketPriorityLabels[priority]}
    </span>
  );
}
