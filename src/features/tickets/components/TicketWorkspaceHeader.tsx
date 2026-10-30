import { Card, Space, Typography } from 'antd';
import type { TicketDto } from '../model/ticket.types';
import { TicketStatusTag } from './TicketStatusTag';

export function TicketWorkspaceHeader({ ticket }: { ticket: TicketDto }) {
  return (
    <Card style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
      <Space size={10} wrap>
        <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{ticket.ticketNumber}</span>
        <TicketStatusTag status={ticket.status} />
      </Space>
      <Typography.Title level={2} style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 20 }}>
        {ticket.title}
      </Typography.Title>
      <Typography.Paragraph style={{ margin: '12px 0 0', color: 'var(--tx2)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {ticket.description}
      </Typography.Paragraph>
    </Card>
  );
}
