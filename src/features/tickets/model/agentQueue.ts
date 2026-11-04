import { TicketStatus } from './ticket.types';
import type { AgentQueueFilters, AgentQueueScope } from './ticket.types';

export const AGENT_QUEUE_PAGE_SIZES = [10, 20, 50] as const;

export const defaultAgentQueueFilters: AgentQueueFilters = {
  scope: 'unassigned',
  status: null,
  category: null,
  priority: null,
  sortByPriority: false,
  page: 1,
  pageSize: 10,
};

// Descriptions follow GetAgentQueueAsync on backend `dev`: scopes filter on the assignee and
// leave out Closed and Cancelled tickets.
export const agentQueueScopes: readonly { scope: AgentQueueScope; label: string; description: string }[] = [
  { scope: 'unassigned', label: 'Chưa phân công', description: 'Ticket chưa có người phụ trách, trừ ticket đã đóng hoặc đã hủy.' },
  { scope: 'my', label: 'Của tôi', description: 'Ticket đang giao cho bạn, trừ ticket đã đóng hoặc đã hủy.' },
  { scope: 'all', label: 'Tất cả', description: 'Toàn bộ ticket trong hệ thống.' },
];

/** Statuses the implemented commands can produce; the others never appear in data yet. */
export const agentQueueStatusOptions: readonly TicketStatus[] = [
  TicketStatus.Submitted,
  TicketStatus.Assigned,
  TicketStatus.InProgress,
  TicketStatus.Resolved,
  TicketStatus.Closed,
  TicketStatus.Cancelled,
];
