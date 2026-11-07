import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import { useAuth, useDepartments } from '@/features/auth';
import type { TicketDto } from '../model/ticket.types';
import { assignmentLabel } from '../model/assignment';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { useStaffDirectory } from '../hooks/useStaffDirectory';
import { TicketPriorityTag } from './TicketPriorityTag';
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
  const { user } = useAuth();
  const staff = useStaffDirectory();
  const departments = useDepartments();
  const departmentName = ticket.requesterDepartmentId
    ? departments.data?.find((d) => d.id === ticket.requesterDepartmentId)?.name ?? null
    : null;

  return (
    <Card title="Thông tin ticket" size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)', fontSize: 13 }}>
      <dl style={{ margin: 0 }}>
        <Field label="Mã ticket"><span className="mono">{ticket.ticketNumber}</span></Field>
        <Field label="Trạng thái"><TicketStatusTag status={ticket.status} /></Field>
        <Field label="Ưu tiên"><TicketPriorityTag priority={ticket.priority} /></Field>
        <Field label="Danh mục">{ticketCategoryLabels[ticket.categoryId]}</Field>
        <Field label="Phòng ban">{departmentName ? departmentName : unavailable}</Field>
        <Field label="Người yêu cầu">{unavailable}</Field>
        <Field label="Phụ trách">{assignmentLabel(ticket, user?.userId, staff.data)}</Field>
        <Field label="Tạo lúc">{formatCreatedAt(ticket.createdAt)}</Field>
      </dl>
    </Card>
  );
}
