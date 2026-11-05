import type { AgentDirectoryEntry, TicketDto } from './ticket.types';

export const UNNAMED_AGENT = 'Kỹ thuật viên chưa có tên';

/** The directory sends no email: an agent without a name is told apart by the start of their id. */
export function agentName(entry: AgentDirectoryEntry) {
  return entry.fullName ?? `${UNNAMED_AGENT} (${entry.userId.slice(0, 8)})`;
}

/**
 * The ticket carries only the assignee's id; the name comes from the agent directory, which only
 * staff can read. Without it, only who holds the ticket relative to the viewer is shown.
 */
export function assignmentLabel(
  ticket: Pick<TicketDto, 'assignedToId'>,
  currentUserId: string | undefined,
  directory: readonly AgentDirectoryEntry[] = [],
) {
  if (ticket.assignedToId === null) return 'Chưa phân công';
  if (ticket.assignedToId === currentUserId) return 'Bạn';
  const assignee = directory.find((entry) => entry.userId === ticket.assignedToId);
  return assignee ? agentName(assignee) : 'Đã phân công';
}
