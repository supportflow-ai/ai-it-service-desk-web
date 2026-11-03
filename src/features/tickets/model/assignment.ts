import type { TicketDto } from './ticket.types';

/** The backend returns the assignee's id but no name, so only who holds the ticket relative to the viewer is shown. */
export function assignmentLabel(ticket: Pick<TicketDto, 'assignedToId'>, currentUserId: string | undefined) {
  if (ticket.assignedToId === null) return 'Chưa phân công';
  if (ticket.assignedToId === currentUserId) return 'Bạn';
  return 'Đã phân công';
}
