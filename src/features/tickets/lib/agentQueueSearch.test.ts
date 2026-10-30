import { describe, expect, it } from 'vitest';
import { TicketStatus } from '../model/ticket.types';
import { defaultAgentQueueFilters } from '../model/agentQueue';
import { parseAgentQueueSearch, queueReturnPath, toAgentQueueSearch, workspaceTicketPath } from './agentQueueSearch';

describe('agent queue URL state', () => {
  it('uses the defaults for an empty or garbage query', () => {
    expect(parseAgentQueueSearch(new URLSearchParams())).toEqual(defaultAgentQueueFilters);
    expect(parseAgentQueueSearch(new URLSearchParams('scope=team&status=99&category=nope&page=-2&pageSize=7')))
      .toEqual(defaultAgentQueueFilters);
    expect(parseAgentQueueSearch(new URLSearchParams('status=1.5&page=2e3'))).toEqual(defaultAgentQueueFilters);
  });

  it('round-trips every supported filter and keeps the default URL clean', () => {
    const filters = { scope: 'all' as const, status: TicketStatus.InProgress, category: 'VPN' as const, page: 3, pageSize: 20 };
    const search = toAgentQueueSearch(filters);
    expect(search.toString()).toBe('scope=all&status=2&category=VPN&page=3&pageSize=20');
    expect(parseAgentQueueSearch(search)).toEqual(filters);
    expect(toAgentQueueSearch(defaultAgentQueueFilters).toString()).toBe('');
  });

  it('only returns to the queue, whatever router state it is given', () => {
    expect(queueReturnPath({ queueSearch: '?scope=all&page=2' })).toBe('/agent-workspace?scope=all&page=2');
    expect(queueReturnPath({ queueSearch: '' })).toBe('/agent-workspace');
    expect(queueReturnPath({ queueSearch: '//evil.example' })).toBe('/agent-workspace');
    expect(queueReturnPath({ queueSearch: '?a=1#frag' })).toBe('/agent-workspace');
    expect(queueReturnPath(null)).toBe('/agent-workspace');
  });

  it('builds the workspace path from the ticket id', () => {
    expect(workspaceTicketPath('10000000-0000-0000-0000-000000000001')).toBe('/agent-workspace/tickets/10000000-0000-0000-0000-000000000001');
  });
});
