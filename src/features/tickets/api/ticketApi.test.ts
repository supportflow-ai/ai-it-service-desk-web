import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { ticketA } from '../../../../tests/fixtures';
import contract from '../../../../tests/contracts/ticket-status.json';
import { ticketApi } from './ticketApi';
import { TicketStatus } from '../model/ticket.types';

it('preserves every pinned numeric status', () => {
  expect(Object.fromEntries(Object.entries(TicketStatus).filter(([, value]) => typeof value === 'number'))).toEqual(contract);
  expect(TicketStatus.Resolved).toBe(4);
  expect(TicketStatus.Cancelled).toBe(6);
});
it('sends server paging and preserves response metadata', async () => {
  const result = { items: [ticketA], page: 2, pageSize: 5, totalCount: 12 };
  server.use(http.get('http://localhost/api/tickets/me', ({ request }) => {
    const url = new URL(request.url);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('pageSize')).toBe('5');
    return HttpResponse.json(result);
  }));
  expect(await ticketApi.getMyTickets(2, 5)).toEqual(result);
});
it('creates a Submitted ticket using the exact existing payload', async () => {
  const payload = { title: ticketA.title, categoryId: 'NET' as const, description: ticketA.description };
  server.use(http.post('http://localhost/api/tickets', async ({ request }) => {
    expect(await request.json()).toEqual(payload);
    return HttpResponse.json(ticketA, { status: 201 });
  }));
  expect((await ticketApi.createTicket(payload)).status).toBe(TicketStatus.Submitted);
});
it('rejects malformed ticket payloads', async () => {
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json({ ...ticketA, status: 99 })));
  await expect(ticketApi.getTicketById(ticketA.id)).rejects.toMatchObject({ kind: 'invalid-response' });
});
it('sends agent queue filters and omits the ones that are not set', async () => {
  const seen: Record<string, string>[] = [];
  server.use(http.get('http://localhost/api/tickets/queue', ({ request }) => {
    seen.push(Object.fromEntries(new URL(request.url).searchParams));
    return HttpResponse.json({ items: [ticketA], page: 1, pageSize: 10, totalCount: 1 });
  }));
  await ticketApi.getAgentQueue({ scope: 'unassigned', status: TicketStatus.Submitted, category: 'NET', page: 2, pageSize: 20 });
  await ticketApi.getAgentQueue({ scope: 'all', status: null, category: null, page: 1, pageSize: 10 });
  expect(seen).toEqual([
    { page: '2', pageSize: '20', scope: 'unassigned', status: '1', category: 'NET' },
    { page: '1', pageSize: '10' },
  ]);
});
it('assigns with the backend agentId payload and unassigns without a body', async () => {
  const calls: unknown[] = [];
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/assign`, async ({ request }) => {
      calls.push(await request.json());
      return HttpResponse.json({ ...ticketA, status: TicketStatus.Assigned });
    }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/unassign`, async ({ request }) => {
      calls.push(await request.text());
      return HttpResponse.json(ticketA);
    }),
  );
  expect((await ticketApi.assignTicket(ticketA.id, 'agent-guid')).status).toBe(TicketStatus.Assigned);
  expect((await ticketApi.unassignTicket(ticketA.id)).status).toBe(TicketStatus.Submitted);
  expect(calls).toEqual([{ agentId: 'agent-guid' }, '']);
});
