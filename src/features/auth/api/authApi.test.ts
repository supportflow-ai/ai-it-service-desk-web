import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { authApi } from './authApi';
import { sessionStore } from '../lib/sessionStore';
import { apiClient } from '@/shared/api/apiClient';

it('sends anonymous email/password login and accepts nullable fullName and optional refreshToken', async () => {
  sessionStore.setToken('old-token');
  server.use(http.post('http://localhost/api/auth/login', async ({ request }) => {
    expect(request.headers.get('authorization')).toBeNull();
    expect(await request.json()).toEqual({ email: user.email, password: 'password' });
    return HttpResponse.json({ token: 'new-token', refreshToken: 'refresh-1', user });
  }));
  expect(await authApi.login({ email: user.email, password: 'password' })).toEqual({
    token: 'new-token',
    refreshToken: 'refresh-1',
    user,
  });
});

it('keeps an existing session on a failed anonymous login', async () => {
  sessionStore.setToken('existing');
  server.use(http.post('http://localhost/api/auth/login', () => new HttpResponse(null, { status: 401 })));
  await expect(authApi.login({ email: user.email, password: 'wrong' })).rejects.toMatchObject({ status: 401 });
  expect(sessionStore.getSnapshot().token).toBe('existing');
});

it('register sends the pinned payload and accepts refreshToken', async () => {
  const payload = { email: user.email, password: 'password', fullName: 'Synthetic' };
  server.use(http.post('http://localhost/api/auth/register', async ({ request }) => {
    expect(await request.json()).toEqual(payload);
    expect(request.headers.get('authorization')).toBeNull();
    return HttpResponse.json(
      { token: 'registered', refreshToken: 'reg-refresh', user: { ...user, fullName: payload.fullName } },
      { status: 201 },
    );
  }));
  const res = await authApi.register(payload);
  expect(res.token).toBe('registered');
  expect(res.refreshToken).toBe('reg-refresh');
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

it('403 preserves the current session while current-session 401 without refresh expires it', async () => {
  sessionStore.setToken('current');
  server.use(http.get('http://localhost/api/private', () => new HttpResponse(null, { status: 403 })));
  await expect(apiClient.get('/private')).rejects.toMatchObject({ status: 403 });
  expect(sessionStore.getSnapshot().token).toBe('current');
  server.use(http.get('http://localhost/api/private', () => new HttpResponse(null, { status: 401 })));
  await expect(apiClient.get('/private')).rejects.toMatchObject({ status: 401 });
  expect(sessionStore.getSnapshot().token).toBeNull();
});

it('silent-refreshes token on 401 when refreshToken is present, and retries request', async () => {
  sessionStore.setTokens('expired-access', 'valid-refresh');
  let attempts = 0;
  server.use(
    http.get('http://localhost/api/private-data', ({ request }) => {
      attempts++;
      if (request.headers.get('authorization') === 'Bearer new-access-token') {
        return HttpResponse.json({ ok: true, data: 'retried-success' });
      }
      return new HttpResponse(null, { status: 401 });
    }),
    http.post('http://localhost/api/auth/refresh', async ({ request }) => {
      const body = await request.json() as { refreshToken: string };
      expect(body.refreshToken).toBe('valid-refresh');
      return HttpResponse.json({
        token: 'new-access-token',
        refreshToken: 'next-refresh',
        user,
      });
    }),
  );

  const response = await apiClient.get<{ ok: boolean; data: string }>('/private-data');
  expect(response.data).toEqual({ ok: true, data: 'retried-success' });
  expect(attempts).toBe(2);
  expect(sessionStore.getSnapshot().token).toBe('new-access-token');
  expect(sessionStore.getSnapshot().refreshToken).toBe('next-refresh');
});

it('expires session when silent refresh fails', async () => {
  sessionStore.setTokens('expired-access', 'expired-refresh');
  server.use(
    http.get('http://localhost/api/private-data', () => new HttpResponse(null, { status: 401 })),
    http.post('http://localhost/api/auth/refresh', () => new HttpResponse(null, { status: 401 })),
  );

  await expect(apiClient.get('/private-data')).rejects.toMatchObject({ status: 401 });
  expect(sessionStore.getSnapshot().token).toBeNull();
});

it('calls revoke endpoint on logout', async () => {
  let revokedKey: string | null = null;
  server.use(
    http.post('http://localhost/api/auth/revoke', async ({ request }) => {
      const body = await request.json() as { refreshToken: string };
      revokedKey = body.refreshToken;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  await authApi.revoke({ refreshToken: 'active-refresh' });
  expect(revokedKey).toBe('active-refresh');
});

it('fetches departments and validates items', async () => {
  server.use(
    http.get('http://localhost/api/departments', () => HttpResponse.json([
      { id: 'dept-1', code: 'IT', name: 'Công nghệ thông tin', description: 'Phòng IT' },
      { id: 'dept-2', code: 'HR', name: 'Nhân sự', description: null },
    ])),
  );

  const depts = await authApi.getDepartments();
  expect(depts).toEqual([
    { id: 'dept-1', code: 'IT', name: 'Công nghệ thông tin', description: 'Phòng IT' },
    { id: 'dept-2', code: 'HR', name: 'Nhân sự', description: null },
  ]);
});

it('performs password reset and roles assignment operations', async () => {
  server.use(
    http.post('http://localhost/api/auth/change-password', () => HttpResponse.json({ message: 'Đổi mật khẩu thành công.' })),
    http.post('http://localhost/api/auth/forgot-password', () => HttpResponse.json({ message: 'Đã gửi OTP.' })),
    http.post('http://localhost/api/auth/reset-password', () => HttpResponse.json({ message: 'Đặt lại thành công.' })),
    http.put('http://localhost/api/users/user-1/roles', () => HttpResponse.json({ message: 'Cập nhật vai trò thành công.' })),
  );

  expect(await authApi.changePassword({ currentPassword: 'old', newPassword: 'new' })).toEqual({ message: 'Đổi mật khẩu thành công.' });
  expect(await authApi.forgotPassword({ email: 'test@example.com' })).toEqual({ message: 'Đã gửi OTP.' });
  expect(await authApi.resetPassword({ email: 'test@example.com', otpCode: '123456', newPassword: 'new' })).toEqual({ message: 'Đặt lại thành công.' });
  expect(await authApi.assignRoles('user-1', { roles: ['Agent', 'Admin'] })).toEqual({ message: 'Cập nhật vai trò thành công.' });
});
