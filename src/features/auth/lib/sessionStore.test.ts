import { expect, it } from 'vitest';
import { sessionStore } from './sessionStore';

function changeInOtherTab(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
  window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: token }));
}

it('follows a sign-in, account switch and sign-out made in another tab', () => {
  localStorage.setItem('token', 'requester-token');
  sessionStore.restore();
  const restored = sessionStore.getSnapshot();
  expect(restored.token).toBe('requester-token');

  changeInOtherTab('agent-token');
  expect(sessionStore.getSnapshot()).toEqual({ token: 'agent-token', version: restored.version + 1, signedOut: false });

  changeInOtherTab(null);
  expect(sessionStore.getSnapshot()).toEqual({ token: null, version: restored.version + 2, signedOut: true });
});

it('tells an explicit sign-out apart from an expired session', () => {
  sessionStore.setToken('first');
  sessionStore.clear();
  expect(sessionStore.getSnapshot().signedOut).toBe(true);

  sessionStore.setToken('second');
  const { token, version } = sessionStore.getSnapshot();
  if (!token) throw new Error('token missing');
  sessionStore.expire(token, version);
  expect(sessionStore.getSnapshot()).toMatchObject({ token: null, signedOut: false });
});

it('ignores storage changes that do not touch the session token', () => {
  sessionStore.restore();
  const before = sessionStore.getSnapshot();
  localStorage.setItem('theme', 'dark');
  window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }));
  expect(sessionStore.getSnapshot()).toBe(before);
});
