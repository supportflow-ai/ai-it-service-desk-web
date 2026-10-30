import type { AgentQueueFilters } from '../model/ticket.types';

export const ticketKeys = {
  session: (version: number) => ['tickets', version] as const,
  list: (version: number, page: number, pageSize: number) => ['tickets', version, 'mine', { page, pageSize }] as const,
  queue: (version: number, filters: AgentQueueFilters) => ['tickets', version, 'queue', { ...filters }] as const,
  detail: (version: number, id: string) => ['tickets', version, 'detail', id] as const,
  timeline: (version: number, id: string) => ['tickets', version, 'timeline', id] as const,
};
