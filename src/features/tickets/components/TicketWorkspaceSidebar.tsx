import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import type { TicketDto } from '../model/ticket.types';
import { assignmentView } from '../model/assignment';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { TicketStatusTag } from './TicketStatusTag';

function formatCreatedAt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>{label}</dt>
      <dd style={{ margin: 0, color: 'var(--tx)' }}>{children}</dd>
    </>
  );
}

const unavailable = <Typography.Text type="secondary">Chưa có thông tin</Typography.Text>;

/** Only fields the backend TicketDto actually returns are shown as values. */
export function TicketWorkspaceSidebar({ ticket }: { ticket: TicketDto }) {
  const assignment = assignmentView(ticket.status);
  return (
    <Card title="Thông tin ticket" size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)', fontSize: 13 }}>
      <dl style={{ margin: 0 }}>
        <Field label="Mã ticket"><span className="mono">{ticket.ticketNumber}</span></Field>
        <Field label="Trạng thái"><TicketStatusTag status={ticket.status} /></Field>
        <Field label="Danh mục">{ticketCategoryLabels[ticket.categoryId]}</Field>
        <Field label="Người yêu cầu">{unavailable}</Field>
        <Field label="Phụ trách">{assignment.known ? assignment.label : unavailable}</Field>
        <Field label="Tạo lúc">{formatCreatedAt(ticket.createdAt)}</Field>
      </dl>
    </Card>
  );
}
