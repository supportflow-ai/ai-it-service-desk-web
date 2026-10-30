import { TicketStatus } from './ticket.types';

export const ticketStatusMeta = {
  [TicketStatus.Draft]: { label: 'Bản nháp', color: 'default' },
  [TicketStatus.Submitted]: { label: 'Đã gửi', color: 'blue' },
  [TicketStatus.InProgress]: { label: 'Đang xử lý', color: 'processing' },
  [TicketStatus.PendingUser]: { label: 'Chờ phản hồi', color: 'warning' },
  [TicketStatus.Resolved]: { label: 'Đã giải quyết', color: 'success' },
  [TicketStatus.Closed]: { label: 'Đã đóng', color: 'default' },
  [TicketStatus.Cancelled]: { label: 'Đã hủy', color: 'default' },
  [TicketStatus.Triaged]: { label: 'Đã phân loại', color: 'blue' },
  [TicketStatus.Assigned]: { label: 'Đã phân công', color: 'blue' },
  [TicketStatus.PendingExternal]: { label: 'Chờ đối tác', color: 'warning' },
} satisfies Record<TicketStatus, { label: string; color: string }>;

/** Closed and Cancelled end the lifecycle: no transition or assignment command accepts them. */
export function isTerminalStatus(status: TicketStatus) {
  return status === TicketStatus.Closed || status === TicketStatus.Cancelled;
}
