import { expect, it } from 'vitest';
import { sessionStore } from './sessionStore';

function changeInOtherTab(token: string | null, refreshToken: string | null = null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  else localStorage.removeItem('refreshToken');
  window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: token }));
}

it('follows a sign-in, account switch and sign-out made in another tab', () => {
  localStorage.setItem('token', 'requester-token');
  localStorage.setItem('refreshToken', 'requester-refresh');
  sessionStore.restore();
  const restored = sessionStore.getSnapshot();
  expect(restored.token).toBe('requester-token');
  expect(restored.refreshToken).toBe('requester-refresh');

  changeInOtherTab('agent-token', 'agent-refresh');
  expect(sessionStore.getSnapshot()).toEqual({
    token: 'agent-token',
    refreshToken: 'agent-refresh',
    version: restored.version + 1,
    signedOut: false,
  });

  changeInOtherTab(null, null);
  expect(sessionStore.getSnapshot()).toEqual({
    token: null,
    refreshToken: null,
    version: restored.version + 2,
    signedOut: true,
  });
});

it('tells an explicit sign-out apart from an expired session', () => {
  sessionStore.setTokens('first', 'first-refresh');
  sessionStore.clear();
  expect(sessionStore.getSnapshot().signedOut).toBe(true);
  expect(sessionStore.getSnapshot().refreshToken).toBeNull();

  sessionStore.setTokens('second', 'second-refresh');
  const { token, version } = sessionStore.getSnapshot();
  if (!token) throw new Error('token missing');
  sessionStore.expire(token, version);
  expect(sessionStore.getSnapshot()).toMatchObject({ token: null, refreshToken: null, signedOut: false });
});

it('ignores storage changes that do not touch the session token', () => {
  sessionStore.restore();
  const before = sessionStore.getSnapshot();
  localStorage.setItem('theme', 'dark');
  window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }));
  expect(sessionStore.getSnapshot()).toBe(before);
});
