import { TicketStatus } from './ticket.types';

export interface AssignmentView {
  label: string;
  /** False when the server data cannot tell whether someone is assigned. */
  known: boolean;
}

/**
 * TicketDto carries no assignee, so assignment is read from the status the domain sets:
 * Assign moves Submitted → Assigned and Unassign moves Assigned → Submitted. In every other
 * status (for example after Claim) the assignee cannot be derived.
 */
export function assignmentView(status: TicketStatus): AssignmentView {
  if (status === TicketStatus.Submitted) return { label: 'Chưa phân công', known: true };
  if (status === TicketStatus.Assigned) return { label: 'Đã phân công', known: true };
  return { label: 'Chưa có thông tin', known: false };
}
