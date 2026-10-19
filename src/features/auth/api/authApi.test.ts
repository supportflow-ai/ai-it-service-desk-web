import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { authApi } from './authApi';
import { sessionStore } from '../lib/sessionStore';
import { apiClient } from '@/shared/api/apiClient';

it('sends anonymous email/password login and accepts nullable fullName', async () => {
  sessionStore.setToken('old-token');
  server.use(http.post('http://localhost/api/auth/login', async ({ request }) => {
    expect(request.headers.get('authorization')).toBeNull();
    expect(await request.json()).toEqual({ email: user.email, password: 'password' });
    return HttpResponse.json({ token: 'new-token', user });
  }));
  expect(await authApi.login({ email: user.email, password: 'password' })).toEqual({ token: 'new-token', user });
});

it('keeps an existing session on a failed anonymous login', async () => {
  sessionStore.setToken('existing');
  server.use(http.post('http://localhost/api/auth/login', () => new HttpResponse(null, { status: 401 })));
  await expect(authApi.login({ email: user.email, password: 'wrong' })).rejects.toMatchObject({ status: 401 });
  expect(sessionStore.getSnapshot().token).toBe('existing');
});

it('register sends the pinned payload', async () => {
  const payload = { email: user.email, password: 'password', fullName: 'Synthetic' };
  server.use(http.post('http://localhost/api/auth/register', async ({ request }) => {
    expect(await request.json()).toEqual(payload);
    expect(request.headers.get('authorization')).toBeNull();
    return HttpResponse.json({ token: 'registered', user: { ...user, fullName: payload.fullName } }, { status: 201 });
  }));
  expect((await authApi.register(payload)).token).toBe('registered');
});

it('rejects malformed successful auth responses instead of persisting undefined', async () => {
  server.use(http.post('http://localhost/api/auth/login', () => HttpResponse.json({ accessToken: 'wrong-contract' })));
  await expect(authApi.login({ email: user.email, password: 'password' })).rejects.toMatchObject({ kind: 'invalid-response' });
});

it('does not expire a newer session when an old request returns 401', async () => {
  let release = () => {};
  let started = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const ready = new Promise<void>((resolve) => { started = resolve; });
  sessionStore.setToken('old');
  server.use(http.get('http://localhost/api/private', async () => {
    started(); await gate; return new HttpResponse(null, { status: 401 });
  }));
  const pending = apiClient.get('/private').catch((error: unknown) => error);
  await ready;
  sessionStore.setToken('new');
  release();
  expect(await pending).toMatchObject({ status: 401 });
  expect(sessionStore.getSnapshot().token).toBe('new');
});

it('403 preserves the current session while current-session 401 expires it', async () => {
  sessionStore.setToken('current');
  server.use(http.get('http://localhost/api/private', () => new HttpResponse(null, { status: 403 })));
  await expect(apiClient.get('/private')).rejects.toMatchObject({ status: 403 });
  expect(sessionStore.getSnapshot().token).toBe('current');
  server.use(http.get('http://localhost/api/private', () => new HttpResponse(null, { status: 401 })));
  await expect(apiClient.get('/private')).rejects.toMatchObject({ status: 401 });
  expect(sessionStore.getSnapshot().token).toBeNull();
});
