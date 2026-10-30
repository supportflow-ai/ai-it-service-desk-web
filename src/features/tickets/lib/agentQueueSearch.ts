import { isRecord } from '@/shared/lib/guards';
import { AGENT_QUEUE_PAGE_SIZES, agentQueueScopes, agentQueueStatusOptions, defaultAgentQueueFilters } from '../model/agentQueue';
import { TicketCategory } from '../model/ticket.types';
import type { AgentQueueFilters } from '../model/ticket.types';

export const AGENT_QUEUE_PATH = '/agent-workspace';

export function workspaceTicketPath(ticketId: string) {
  return `${AGENT_QUEUE_PATH}/tickets/${encodeURIComponent(ticketId)}`;
}

function positiveInt(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && Number.isSafeInteger(parsed) ? parsed : null;
}

/** Reads queue filters from the URL; anything unknown falls back to the default. */
export function parseAgentQueueSearch(params: URLSearchParams): AgentQueueFilters {
  const scope = agentQueueScopes.find((item) => item.scope === params.get('scope'))?.scope;
  const statusNumber = positiveInt(params.get('status'));
  const status = agentQueueStatusOptions.find((option) => option === statusNumber);
  const category = Object.values(TicketCategory).find((value) => value === params.get('category'));
  const pageSize = AGENT_QUEUE_PAGE_SIZES.find((size) => size === positiveInt(params.get('pageSize')));
  return {
    scope: scope ?? defaultAgentQueueFilters.scope,
    status: status ?? null,
    category: category ?? null,
    page: positiveInt(params.get('page')) ?? 1,
    pageSize: pageSize ?? defaultAgentQueueFilters.pageSize,
  };
}

/** Writes only values that differ from the defaults, so the plain queue URL stays clean. */
export function toAgentQueueSearch(filters: AgentQueueFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.scope !== defaultAgentQueueFilters.scope) params.set('scope', filters.scope);
  if (filters.status !== null) params.set('status', String(filters.status));
  if (filters.category !== null) params.set('category', filters.category);
  if (filters.page !== 1) params.set('page', String(filters.page));
  if (filters.pageSize !== defaultAgentQueueFilters.pageSize) params.set('pageSize', String(filters.pageSize));
  return params;
}

/** Router state carried from a queue row to the workspace. */
export interface QueueReturnState {
  queueSearch: string;
}

/** The queue URL to go back to; only a search string is accepted, so it cannot leave the queue. */
export function queueReturnPath(state: unknown) {
  if (isRecord(state) && typeof state.queueSearch === 'string' && /^\?[^#]*$/.test(state.queueSearch)) {
    return `${AGENT_QUEUE_PATH}${state.queueSearch}`;
  }
  return AGENT_QUEUE_PATH;
}
