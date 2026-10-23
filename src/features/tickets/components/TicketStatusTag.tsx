import { TicketStatus } from '../model/ticket.types';
import { ticketStatusMeta } from '../model/ticketStatus';

export function TicketStatusTag({ status }: { status: TicketStatus }) {
  const meta = ticketStatusMeta[status] ?? { label: 'Không xác định', color: 'default' };

  let statusClass = '';
  if (status === TicketStatus.Resolved || status === TicketStatus.Closed) {
    statusClass = 'ok';
  } else if (status === TicketStatus.PendingUser || status === TicketStatus.PendingExternal) {
    statusClass = 'wn';
  } else if (status === TicketStatus.InProgress) {
    statusClass = 'in';
  } else if (status === TicketStatus.Cancelled) {
    statusClass = 'er';
  }

  return (
    <span className={`status-tag ${statusClass}`} style={{ verticalAlign: 'middle' }}>
      {meta.label}
    </span>
  );
}
