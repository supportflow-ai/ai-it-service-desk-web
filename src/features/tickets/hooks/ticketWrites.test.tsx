import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { ticketA, timelineItemA, user } from '../../../../tests/fixtures';
import { createTestWrapper } from '../../../../tests/render';
import { sessionStore } from '@/features/auth';
import { defaultAgentQueueFilters } from '../model/agentQueue';
import { TicketStatus } from '../model/ticket.types';
import { useAgentQueue } from './useAgentQueue';
import { useAddComment } from './useAddComment';
import { useClaimTicket } from './useClaimTicket';
import { useTicket } from './useTicket';
import { useTicketTimeline } from './useTicketTimeline';
import { useTickets } from './useTickets';

const reads = { detail: 0, timeline: 0, mine: 0, queue: 0 };
const page = { items: [ticketA], page: 1, pageSize: 10, totalCount: 1 };

beforeEach(() => {
  Object.assign(reads, { detail: 0, timeline: 0, mine: 0, queue: 0 });
  sessionStore.setToken('agent');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })),
    http.get(`http://localhost/api/tickets/${ticketA.id}`, () => { reads.detail += 1; return HttpResponse.json(ticketA); }),
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => { reads.timeline += 1; return HttpResponse.json([]); }),
    http.get('http://localhost/api/tickets/me', () => { reads.mine += 1; return HttpResponse.json(page); }),
    http.get('http://localhost/api/tickets/queue', () => { reads.queue += 1; return HttpResponse.json(page); }),
  );
});

function renderWorkspaceReads() {
  const { Wrapper } = createTestWrapper();
  const hook = renderHook(() => ({
    detail: useTicket(ticketA.id),
    timeline: useTicketTimeline(ticketA.id),
    mine: useTickets(1, 10),
    queue: useAgentQueue(defaultAgentQueueFilters),
    claim: useClaimTicket(ticketA.id),
    comment: useAddComment(ticketA.id),
  }), { wrapper: Wrapper });
  return hook;
}

async function settled(hook: ReturnType<typeof renderWorkspaceReads>) {
  await waitFor(() => {
    const { detail, timeline, mine, queue } = hook.result.current;
    expect([detail, timeline, mine, queue].every((query) => query.isSuccess && !query.isFetching)).toBe(true);
  });
}

it('refreshes the ticket, its activity and every list after a status change', async () => {
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/claim`, () => HttpResponse.json({ ...ticketA, status: TicketStatus.InProgress })));
  const hook = renderWorkspaceReads();
  await settled(hook);
  expect(reads).toEqual({ detail: 1, timeline: 1, mine: 1, queue: 1 });

  await act(async () => { await hook.result.current.claim.mutateAsync(); });
  await settled(hook);
  expect(reads).toEqual({ detail: 2, timeline: 2, mine: 2, queue: 2 });
});

it('refreshes only the conversation after a comment', async () => {
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/comments`, () => HttpResponse.json(timelineItemA, { status: 201 })));
  const hook = renderWorkspaceReads();
  await settled(hook);

  await act(async () => { await hook.result.current.comment.mutateAsync({ ticketId: ticketA.id, content: 'Xin chào' }); });
  await settled(hook);
  expect(reads).toEqual({ detail: 1, timeline: 2, mine: 1, queue: 1 });
});

it('refreshes nothing and sends the write once when it fails', async () => {
  let claims = 0;
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/claim`, () => { claims += 1; return new HttpResponse(null, { status: 500 }); }));
  const hook = renderWorkspaceReads();
  await settled(hook);

  await act(async () => { await expect(hook.result.current.claim.mutateAsync()).rejects.toMatchObject({ status: 500 }); });
  expect(claims).toBe(1);
  expect(reads).toEqual({ detail: 1, timeline: 1, mine: 1, queue: 1 });
});
