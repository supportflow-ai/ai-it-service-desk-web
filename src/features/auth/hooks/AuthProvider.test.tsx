import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { createTestWrapper } from '../../../../tests/render';
import { sessionStore } from '../lib/sessionStore';
import { useAuth } from './useAuth';

beforeEach(() => server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json(user))));

it('restores user from Query and removes private cache on logout', async () => {
  sessionStore.setToken('restored');
  const { Wrapper, queryClient } = createTestWrapper();
  const auth = renderHook(useAuth, { wrapper: Wrapper });
  await waitFor(() => expect(auth.result.current.status).toBe('authenticated'));
  expect(auth.result.current.user?.fullName).toBeNull();
  queryClient.setQueryData(['tickets', auth.result.current.sessionVersion, 'private'], 'old-account-data');
  act(() => auth.result.current.logout());
  await waitFor(() => expect(auth.result.current.status).toBe('anonymous'));
  expect(queryClient.getQueryCache().getAll().some((query) => query.queryKey[0] === 'tickets')).toBe(false);
  expect(localStorage.getItem('token')).toBeNull();
});

it.each(['network', 'server'])('keeps token and offers recovery after a %s restore error', async (kind) => {
  sessionStore.setToken('keep-me');
  server.use(http.get('http://localhost/api/auth/me', () => kind === 'network' ? HttpResponse.error() : new HttpResponse(null, { status: 500 })));
  const { Wrapper } = createTestWrapper();
  const auth = renderHook(useAuth, { wrapper: Wrapper });
  await waitFor(() => expect(auth.result.current.status).toBe('unavailable'));
  expect(localStorage.getItem('token')).toBe('keep-me');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)));
  act(() => auth.result.current.retrySession());
  await waitFor(() => expect(auth.result.current.status).toBe('authenticated'));
});

it.each([401, 404])('ends a session rejected by /me with %i', async (status) => {
  sessionStore.setToken('invalid');
  server.use(http.get('http://localhost/api/auth/me', () => new HttpResponse(null, { status })));
  const { Wrapper } = createTestWrapper();
  const auth = renderHook(useAuth, { wrapper: Wrapper });
  await waitFor(() => expect(auth.result.current.status).toBe('anonymous'));
  expect(sessionStore.getSnapshot().token).toBeNull();
});

it('logs in through a mutation and changes the session cache partition', async () => {
  server.use(http.post('http://localhost/api/auth/login', () => HttpResponse.json({ token: 'logged-in', user })));
  const { Wrapper } = createTestWrapper();
  const auth = renderHook(useAuth, { wrapper: Wrapper });
  const previous = auth.result.current.sessionVersion;
  await act(async () => auth.result.current.login({ email: user.email, password: 'password' }));
  await waitFor(() => expect(auth.result.current.status).toBe('authenticated'));
  expect(auth.result.current.sessionVersion).toBeGreaterThan(previous);
  expect(localStorage.getItem('token')).toBe('logged-in');
});

it('does not restore or navigate a login result after the session was explicitly ended', async () => {
  let release = () => {};
  let started = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const ready = new Promise<void>((resolve) => { started = resolve; });
  server.use(http.post('http://localhost/api/auth/login', async () => {
    started(); await gate; return HttpResponse.json({ token: 'late-token', user });
  }));
  const { Wrapper } = createTestWrapper();
  const auth = renderHook(useAuth, { wrapper: Wrapper });
  const pending = auth.result.current.login({ email: user.email, password: 'password' }).catch((error: unknown) => error);
  await ready;
  await act(async () => { auth.result.current.logout(); release(); expect(await pending).toMatchObject({ kind: 'canceled' }); });
  expect(auth.result.current.status).toBe('anonymous');
  expect(localStorage.getItem('token')).toBeNull();
});
