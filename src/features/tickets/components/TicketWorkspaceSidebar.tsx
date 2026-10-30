import type { TicketDto } from '../model/ticket.types';
import { TicketStatusTag } from './TicketStatusTag';
import { ticketCategoryLabels } from '../model/ticketCategories';

export function TicketWorkspaceSidebar({ ticket }: { ticket: TicketDto }) {
  // The backend TicketDto has no priority yet; show nothing rather than a made-up value.
  const priority = ticket.priority;
  const priorityClass = priority === 'P1' ? 'pri p1' : priority === 'P2' ? 'pri p2' : 'pri p3';
  const priorityLabel = priority === 'P1' ? 'P1 — Khẩn' : priority === 'P2' ? 'P2 — Cao' : 'P3 — Trung bình';

  return (
    <div
      style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 8,
        padding: 16,
        fontSize: 13,
      }}
    >
      <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
        {ticket.ticketNumber}
      </div>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <TicketStatusTag status={ticket.status} />
      </div>

      <dl style={{ margin: 0 }}>
        <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Người yêu cầu</dt>
        <dd style={{ margin: 0, fontWeight: 500, color: 'var(--tx)' }}>
          {ticket.requesterName ?? '—'}
        </dd>

        <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Phòng ban</dt>
        <dd style={{ margin: 0, color: 'var(--tx)' }}>
          {ticket.departmentName ?? '—'}
        </dd>

        <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Danh mục</dt>
        <dd style={{ margin: 0, color: 'var(--tx)' }}>
          {ticketCategoryLabels[ticket.categoryId] ?? ticket.categoryId}
        </dd>

        <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Ưu tiên</dt>
        <dd style={{ margin: 0 }}>
          {priority ? <span className={priorityClass}>{priorityLabel}</span> : <span style={{ color: 'var(--tx)' }}>—</span>}
        </dd>

        <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Phụ trách</dt>
        <dd style={{ margin: 0, color: 'var(--tx)' }}>
          {ticket.assignedToName ?? 'Chưa phân công'}
        </dd>

        <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Tạo lúc</dt>
        <dd style={{ margin: 0, color: 'var(--tx)' }}>
          {new Date(ticket.createdAt).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </dd>

        {ticket.deviceCode && (
          <>
            <dt style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 10 }}>Thiết bị</dt>
            <dd className="mono" style={{ margin: 0, color: 'var(--tx)' }}>
              {ticket.deviceCode}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
