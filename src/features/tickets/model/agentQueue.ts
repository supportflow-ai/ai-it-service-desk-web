import { TicketStatus } from './ticket.types';
import type { AgentQueueFilters, AgentQueueScope } from './ticket.types';

export const AGENT_QUEUE_PAGE_SIZES = [10, 20, 50] as const;

export const defaultAgentQueueFilters: AgentQueueFilters = {
  scope: 'unassigned',
  status: null,
  category: null,
  page: 1,
  pageSize: 10,
};

// Descriptions follow GetAgentQueueAsync on backend `dev`: scopes are status-based there.
export const agentQueueScopes: readonly { scope: AgentQueueScope; label: string; description: string }[] = [
  { scope: 'unassigned', label: 'Chưa phân công', description: 'Ticket mới gửi, chưa có ai nhận xử lý.' },
  {
    scope: 'my',
    label: 'Của tôi',
    description: 'Hiện gồm mọi ticket đang xử lý; hệ thống chưa lọc riêng theo người phụ trách.',
  },
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
