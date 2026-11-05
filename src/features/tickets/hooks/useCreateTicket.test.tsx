import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { createTestWrapper } from '../../../../tests/render';
import { sessionStore } from '@/features/auth';
import { useCreateTicket } from './useCreateTicket';

const payload = { title: 'VPN không kết nối', categoryId: 'VPN' as const, description: 'Mất kết nối VPN sau khi đổi mật khẩu.' };
let keys: (string | null)[] = [];
let fail = true;

beforeEach(() => {
  keys = [];
  fail = true;
  sessionStore.setToken('requester');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)),
    http.post('http://localhost/api/tickets', ({ request }) => {
      keys.push(request.headers.get('Idempotency-Key'));
      return fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(ticketA, { status: 201 });
    }),
  );
});

async function submit(create: ReturnType<typeof useCreateTicket>, content: typeof payload) {
  await act(async () => { await create.mutateAsync(content).catch(() => undefined); });
}

it('sends the same key again for the same content, so a retry cannot create a second ticket', async () => {
  const { Wrapper } = createTestWrapper();
  const { result } = renderHook(() => useCreateTicket(), { wrapper: Wrapper });

  await submit(result.current, payload);
  await submit(result.current, payload);
  expect(keys).toHaveLength(2);
  expect(keys[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(keys[1]).toBe(keys[0]);

  // Edited content is a different request, which would otherwise be refused as a key conflict.
  await submit(result.current, { ...payload, title: 'VPN vẫn không kết nối' });
  expect(keys[2]).not.toBe(keys[0]);

  // Once a ticket is created, the next one starts fresh even with identical content.
  fail = false;
  await submit(result.current, payload);
  await submit(result.current, payload);
  expect(keys[4]).not.toBe(keys[3]);
});
