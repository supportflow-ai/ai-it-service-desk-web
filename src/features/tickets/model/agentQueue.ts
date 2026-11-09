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

// Since backend B1-PR3 an Agent reads only the tickets of the support teams they belong to and the
// ones assigned to them; an Admin reads every ticket. The server applies this before counting, so a
// queue can be empty because of it, not only because of the filters.
const AGENT_SCOPE_DESCRIPTION = 'Ticket thuộc nhóm hỗ trợ của bạn hoặc được giao trực tiếp cho bạn.';

/** Text under the scope tabs. `seesAll` is true for an Admin. */
export function agentQueueScopeDescription(scope: AgentQueueScope, seesAll: boolean) {
  const entry = agentQueueScopes.find((item) => item.scope === scope);
  if (scope === 'all' && !seesAll) return AGENT_SCOPE_DESCRIPTION;
  return entry?.description ?? '';
}

export function agentQueueEmptyText(seesAll: boolean) {
  const base = 'Không có ticket nào phù hợp với bộ lọc.';
  return seesAll ? base : `${base} Bạn chỉ thấy ticket thuộc nhóm hỗ trợ của mình hoặc được giao trực tiếp cho bạn; nếu chưa thuộc nhóm nào, hãy nhờ quản trị viên thêm bạn vào nhóm.`;
}

/** Statuses the implemented commands can produce; the others never appear in data yet. */
export const agentQueueStatusOptions: readonly TicketStatus[] = [
  TicketStatus.Submitted,
  TicketStatus.Assigned,
  TicketStatus.InProgress,
  TicketStatus.Resolved,
  TicketStatus.Closed,
  TicketStatus.Cancelled,
];
