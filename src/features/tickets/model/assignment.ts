import type { TicketDto } from './ticket.types';
import { TicketStatus } from './ticket.types';

export interface AssignmentView {
  label: string;
  /** False when the server data cannot tell whether someone is assigned. */
  known: boolean;
}

/** Older API responses without assignedToId retain a conservative status-only fallback. */
export function assignmentView(status: TicketStatus, assignedToId?: TicketDto['assignedToId']): AssignmentView {
  if (assignedToId !== undefined) return assignedToId ? { label: assignedToId, known: true } : { label: 'Chưa phân công', known: true };
  if (status === TicketStatus.Submitted) return { label: 'Chưa phân công', known: true };
  if (status === TicketStatus.Assigned) return { label: 'Đã phân công', known: true };
  return { label: 'Chưa có thông tin', known: false };
}
