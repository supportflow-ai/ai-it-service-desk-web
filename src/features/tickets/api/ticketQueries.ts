import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { AgentQueueFilters } from '../model/ticket.types';

const mine = (version: number) => ['tickets', version, 'mine'] as const;
const queueAll = (version: number) => ['tickets', version, 'queue'] as const;
const writes = (version: number, ticketId: string) => ['tickets', version, 'write', ticketId] as const;

/** What a successful write changed, and therefore which cached reads are stale. */
export type TicketChange = 'state' | 'conversation';

export const ticketKeys = {
  session: (version: number) => ['tickets', version] as const,
  mine,
  list: (version: number, page: number, pageSize: number) => [...mine(version), { page, pageSize }] as const,
  queueAll,
  queue: (version: number, filters: AgentQueueFilters) => [...queueAll(version), { ...filters }] as const,
  detail: (version: number, id: string) => ['tickets', version, 'detail', id] as const,
  timeline: (version: number, id: string) => ['tickets', version, 'timeline', id] as const,
  /** Prefix shared by every write to one ticket, so pending writes can be found per ticket. */
  writes,
  /** Prefix of the writes that change status or assignment, which must not overlap. */
  stateWrites: (version: number, ticketId: string) => [...writes(version, ticketId), 'state'] as const,
  write: (version: number, ticketId: string, change: TicketChange, action: string) =>
    [...writes(version, ticketId), change, action] as const,
};

export const ticketInvalidation = {
  /** A new ticket shows up in the requester's list and the agent queue. */
  created: (version: number): QueryKey[] => [mine(version), queueAll(version)],
  /** Status or assignment changed: the ticket, its activity and every list that shows it. */
  state: (version: number, ticketId: string): QueryKey[] => [
    ticketKeys.detail(version, ticketId),
    ticketKeys.timeline(version, ticketId),
    mine(version),
    queueAll(version),
  ],
  /** A comment or internal note was added: only the conversation changed. */
  conversation: (version: number, ticketId: string): QueryKey[] => [ticketKeys.timeline(version, ticketId)],
};

export async function invalidateTicketQueries(queryClient: QueryClient, keys: QueryKey[]) {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
