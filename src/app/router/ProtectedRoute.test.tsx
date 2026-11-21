import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../tests/render';
import { server } from '../../../tests/mocks/server';
import { user } from '../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import type { Role } from '@/features/auth';
import { ProtectedRoute } from './ProtectedRoute';

function LoginProbe() {
  const location = useLocation();
  return <output data-testid="login">{`login from ${(location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? 'nowhere'}`}</output>;
}

function renderGuarded(roles: readonly Role[] = []) {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route element={<ProtectedRoute roles={roles} />}><Route path="/private" element={<p>private page</p>} /></Route>
        <Route path="/login" element={<LoginProbe />} />
        <Route path="/403" element={<p>forbidden page</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  sessionStore.clear();
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Requester'] })));
});

it('sends someone who is not signed in to the sign-in page and remembers where they were going', async () => {
  // An expired session (not a sign-out) is the case that remembers the page, so it can be returned to after signing in.
  sessionStore.setToken('old');
  const { token, version } = sessionStore.getSnapshot();
  if (!token) throw new Error('token missing');
  sessionStore.expire(token, version);
  renderGuarded();
  expect(await screen.findByTestId('login')).toHaveTextContent('login from /private');
});

it('sends a signed-in account without the role to the forbidden page, keeping its session', async () => {
  sessionStore.setToken('requester');
  renderGuarded(['Admin']);
  expect(await screen.findByText('forbidden page')).toBeInTheDocument();
  expect(sessionStore.getSnapshot().token).toBe('requester');
});

it('lets a session that cannot be checked be retried or left, and keeps the token meanwhile', async () => {
  sessionStore.setToken('keep-me');
  server.use(http.get('http://localhost/api/auth/me', () => new HttpResponse(null, { status: 500 })));
  renderGuarded();
  expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  expect(sessionStore.getSnapshot().token).toBe('keep-me');
  await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
  await waitFor(() => expect(sessionStore.getSnapshot().token).toBeNull());
  expect(await screen.findByTestId('login')).toHaveTextContent('login from nowhere');
});
