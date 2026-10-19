import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { ticketA, ticketB, user } from '../../../../tests/fixtures';
import { createTestWrapper } from '../../../../tests/render';
import { sessionStore } from '@/features/auth';
import { useTicket } from './useTicket';
import { useTickets } from './useTickets';
import { useCreateTicket } from './useCreateTicket';
import { apiClient } from '@/shared/api/apiClient';

beforeEach(() => {
  sessionStore.setToken('first-account');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)));
});

it('cancels an old detail request and never exposes ticket A under ticket B', async () => {
  let release = () => {};
  let ready = () => {};
  let oldSignal: { readonly aborted?: boolean } | undefined;
  const interceptor = apiClient.interceptors.request.use((request) => {
    if (request.url?.endsWith(ticketA.id)) oldSignal = request.signal;
    return request;
  });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const started = new Promise<void>((resolve) => { ready = resolve; });
  server.use(http.get('http://localhost/api/tickets/:id', async ({ params }) => {
    if (params.id === ticketA.id) { ready(); await gate; return HttpResponse.json(ticketA); }
    return HttpResponse.json(ticketB);
  }));
  const { Wrapper } = createTestWrapper();
  const detail = renderHook(({ id }) => useTicket(id), { wrapper: Wrapper, initialProps: { id: ticketA.id } });
  try {
    await started;
    detail.rerender({ id: ticketB.id });
    expect(detail.result.current.data).toBeUndefined();
    await waitFor(() => expect(detail.result.current.data?.id).toBe(ticketB.id));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => { release(); await gate; });
    expect(detail.result.current.data?.id).toBe(ticketB.id);
  } finally { release(); apiClient.interceptors.request.eject(interceptor); }
});

it('does not show cached data from a different account', async () => {
  server.use(http.get('http://localhost/api/tickets/me', ({ request }) => HttpResponse.json({
    items: [request.headers.get('authorization') === 'Bearer first-account' ? ticketA : ticketB], page: 1, pageSize: 10, totalCount: 1,
  })));
  const { Wrapper, queryClient } = createTestWrapper();
  const list = renderHook(() => useTickets(1, 10), { wrapper: Wrapper });
  await waitFor(() => expect(list.result.current.data?.items[0]?.id).toBe(ticketA.id));
  act(() => sessionStore.setToken('second-account'));
  expect(list.result.current.data).toBeUndefined();
  await waitFor(() => expect(list.result.current.data?.items[0]?.id).toBe(ticketB.id));
  expect(JSON.stringify(queryClient.getQueryCache().getAll().map((query) => query.queryKey))).not.toContain('account');
});

it('invalidates the active ticket list after create and does not retry failed writes', async () => {
  let reads = 0;
  let writes = 0;
  server.use(
    http.get('http://localhost/api/tickets/me', () => { reads++; return HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0 }); }),
    http.post('http://localhost/api/tickets', () => { writes++; return HttpResponse.json(ticketA, { status: 201 }); }),
  );
  const { Wrapper } = createTestWrapper();
  const feature = renderHook(() => ({ list: useTickets(1, 10), create: useCreateTicket() }), { wrapper: Wrapper });
  await waitFor(() => expect(feature.result.current.list.isSuccess).toBe(true));
  await act(async () => { await feature.result.current.create.mutateAsync({ title: ticketA.title, description: ticketA.description, categoryId: 'NET' }); });
  expect(reads).toBe(2);
  server.use(http.post('http://localhost/api/tickets', () => { writes++; return new HttpResponse(null, { status: 500 }); }));
  await act(async () => {
    await expect(feature.result.current.create.mutateAsync({ title: ticketA.title, description: ticketA.description, categoryId: 'NET' })).rejects.toMatchObject({ status: 500 });
  });
  expect(writes).toBe(2);
});

it('discards a successful create response from an ended session', async () => {
  let release = () => {};
  let started = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const ready = new Promise<void>((resolve) => { started = resolve; });
  server.use(http.post('http://localhost/api/tickets', async () => { started(); await gate; return HttpResponse.json(ticketA, { status: 201 }); }));
  const { Wrapper } = createTestWrapper();
  const create = renderHook(useCreateTicket, { wrapper: Wrapper });
  const pending = create.result.current.mutateAsync({ title: ticketA.title, description: ticketA.description, categoryId: 'NET' }).catch((error: unknown) => error);
  await ready;
  await act(async () => { sessionStore.clear(); release(); expect(await pending).toMatchObject({ kind: 'canceled' }); });
});
