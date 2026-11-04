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
it('creates a Submitted ticket using the exact existing payload and the idempotency key', async () => {
  const payload = { title: ticketA.title, categoryId: 'NET' as const, description: ticketA.description };
  const keys: (string | null)[] = [];
  server.use(http.post('http://localhost/api/tickets', async ({ request }) => {
    expect(await request.json()).toEqual(payload);
    keys.push(request.headers.get('Idempotency-Key'));
    return HttpResponse.json(ticketA, { status: 201 });
  }));
  expect((await ticketApi.createTicket(payload, 'key-1')).status).toBe(TicketStatus.Submitted);
  expect(keys).toEqual(['key-1']);
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
  await ticketApi.getAgentQueue({ scope: 'unassigned', status: TicketStatus.Submitted, category: 'NET', priority: 'P1', sortByPriority: true, page: 2, pageSize: 20 });
  await ticketApi.getAgentQueue({ scope: 'all', status: null, category: null, priority: null, sortByPriority: false, page: 1, pageSize: 10 });
  expect(seen).toEqual([
    { page: '2', pageSize: '20', scope: 'unassigned', status: '1', category: 'NET', priority: 'P1', sortByPriority: 'true' },
    { page: '1', pageSize: '10' },
  ]);
});

it('reads the priority the backend computed and rejects one it never sends', async () => {
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json({ ...ticketA, priority: 'P2' })));
  expect((await ticketApi.getTicketById(ticketA.id)).priority).toBe('P2');
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json({ ...ticketA, priority: null })));
  expect((await ticketApi.getTicketById(ticketA.id)).priority).toBeNull();
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json({ ...ticketA, priority: 'Urgent' })));
  await expect(ticketApi.getTicketById(ticketA.id)).rejects.toMatchObject({ kind: 'invalid-response' });
});

it('reads the agent directory by id and name, without requiring an email', async () => {
  const seen: string[] = [];
  server.use(http.get('http://localhost/api/users', ({ request }) => {
    seen.push(new URL(request.url).search);
    return HttpResponse.json([{ userId: 'agent-1', fullName: 'Trần Thị Bình' }, { userId: 'agent-2', fullName: null }, { userId: 'agent-3', fullName: '  ' }]);
  }));
  expect(await ticketApi.getAgentDirectory()).toEqual([
    { userId: 'agent-1', fullName: 'Trần Thị Bình' },
    { userId: 'agent-2', fullName: null },
    { userId: 'agent-3', fullName: null },
  ]);
  expect(seen).toEqual(['?role=Agent']);

  server.use(http.get('http://localhost/api/users', () => HttpResponse.json([{ fullName: 'Không có id' }])));
  await expect(ticketApi.getAgentDirectory()).rejects.toMatchObject({ kind: 'invalid-response' });
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
  expect((await ticketApi.assignTicket(ticketA.id, 'agent-guid', 7)).status).toBe(TicketStatus.Assigned);
  expect((await ticketApi.unassignTicket(ticketA.id, 7)).status).toBe(TicketStatus.Submitted);
  expect(calls).toEqual([{ agentId: 'agent-guid', expectedRevision: 7 }, '']);
});
it('sends the revision the user acted on with every status and assignment command', async () => {
  const seen: string[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/:command`, async ({ request, params }) => {
    seen.push(`${String(params.command)}?${new URL(request.url).searchParams.toString()} ${await request.text()}`);
    return HttpResponse.json(ticketA);
  }));
  await ticketApi.assignTicket(ticketA.id, 'agent-guid', 11);
  await ticketApi.unassignTicket(ticketA.id, 12);
  await ticketApi.claimTicket(ticketA.id, 13);
  await ticketApi.resolveTicket(ticketA.id, 14);
  await ticketApi.closeTicket(ticketA.id, 15);
  await ticketApi.reopenTicket(ticketA.id, 16);
  await ticketApi.cancelTicket(ticketA.id, 17);
  expect(seen).toEqual([
    'assign? {"agentId":"agent-guid","expectedRevision":11}',
    'unassign?expectedRevision=12 ',
    'claim?expectedRevision=13 ',
    'resolve?expectedRevision=14 ',
    'close?expectedRevision=15 ',
    'reopen?expectedRevision=16 ',
    'cancel?expectedRevision=17 ',
  ]);
});
it.each([undefined, null, -1, 1.5, '7'])('rejects a ticket whose revision is %j', async (revision) => {
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json({ ...ticketA, revision })));
  await expect(ticketApi.getTicketById(ticketA.id)).rejects.toMatchObject({ kind: 'invalid-response' });
});
it('accepts both presigned upload shapes and rejects malformed policy fields', async () => {
  const presign = { uploadUrl: 'https://storage.example.com/servicedesk', storageKey: `uploads/pending/${ticketA.id}/1`, expirySeconds: 3600 };
  let formData: unknown;
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json({ ...presign, formData })));
  const payload = { fileName: 'log.txt', fileSizeBytes: 5, contentType: 'text/plain' };

  expect(await ticketApi.generateAttachmentUploadUrl(ticketA.id, payload)).toEqual(presign);
  formData = null;
  expect((await ticketApi.generateAttachmentUploadUrl(ticketA.id, payload)).formData).toBeNull();
  formData = { key: presign.storageKey, policy: 'signed' };
  expect((await ticketApi.generateAttachmentUploadUrl(ticketA.id, payload)).formData).toEqual(formData);
  formData = { key: presign.storageKey, size: 5 };
  await expect(ticketApi.generateAttachmentUploadUrl(ticketA.id, payload)).rejects.toMatchObject({ kind: 'invalid-response' });
});
it('confirms an upload with its metadata and reads the stored attachment list', async () => {
  const attachment = {
    id: '30000000-0000-0000-0000-000000000001', ticketId: ticketA.id, fileName: 'log.txt', fileSizeBytes: 5,
    contentType: 'text/plain', storageKey: `tickets/${ticketA.id}/attachments/1`, uploadedBy: 'user-guid', createdAt: '2026-11-03T08:00:00Z',
  };
  const confirmed: unknown[] = [];
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, async ({ request }) => {
      confirmed.push(await request.json());
      return HttpResponse.json(attachment, { status: 201 });
    }),
    http.get(`http://localhost/api/tickets/${ticketA.id}/attachments`, () => HttpResponse.json([attachment, { ...attachment, storageKey: 7 }])),
  );
  const payload = { fileName: 'log.txt', fileSizeBytes: 5, contentType: 'text/plain', storageKey: `uploads/pending/${ticketA.id}/1` };
  expect(await ticketApi.confirmAttachmentUpload(ticketA.id, payload)).toEqual(attachment);
  expect(confirmed).toEqual([payload]);
  await expect(ticketApi.getTicketAttachments(ticketA.id)).rejects.toMatchObject({ kind: 'invalid-response' });
});
