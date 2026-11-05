import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../tests/render';
import { server } from '../../../tests/mocks/server';
import { user } from '../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { ThemeModeProvider } from '../providers/ThemeModeProvider';
import { ProtectedRoute } from '../router/ProtectedRoute';
import { MainLayout } from './MainLayout';

function LoginProbe() {
  const location = useLocation();
  return <p>login page, state: {JSON.stringify(location.state)}</p>;
}

function renderAt(path: string, roles: string[]) {
  renderWithin(path, roles, false);
}

function renderWithin(path: string, roles: string[], themed: boolean) {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  const ThemeWrapper = themed ? ThemeModeProvider : Fragment;
  render(
    <ThemeWrapper>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/admin-panel" element={<p>admin page</p>} />
            <Route path="/agent-workspace" element={<p>queue page</p>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
    </ThemeWrapper>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => sessionStore.clear());

it.each([
  [['Admin'], 'Quản trị viên'],
  [['Agent'], 'Kỹ thuật viên'],
  [['Requester'], 'Người yêu cầu'],
  [['Requester', 'Agent'], 'Kỹ thuật viên · Người yêu cầu'],
])('labels %j accounts by their real roles', async (roles, label) => {
  renderAt('/agent-workspace', roles);
  expect(await screen.findByTestId('current-roles')).toHaveTextContent(label);
});

it('signs out to a clean login page, so the next account is not sent to this one\'s page', async () => {
  renderAt('/admin-panel', ['Admin']);
  await userEvent.click(await screen.findByRole('button', { name: /Đăng xuất/ }));
  expect(await screen.findByText('login page, state: null')).toBeInTheDocument();
  expect(sessionStore.getSnapshot().token).toBeNull();
});

it('locks search and notifications, which have no backend yet', async () => {
  renderAt('/agent-workspace', ['Agent']);
  expect(await screen.findByRole('textbox', { name: /Tìm kiếm/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Thông báo/ })).toBeDisabled();
  expect(screen.queryByText('Production')).not.toBeInTheDocument();
});

it('switches between light, dark and the system setting from the header', async () => {
  renderWithin('/agent-workspace', ['Agent'], true);
  await userEvent.click(await screen.findByRole('button', { name: 'Giao diện: Theo hệ thống' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /Tối/ }));
  expect(await screen.findByRole('button', { name: 'Giao diện: Tối' })).toBeInTheDocument();
  expect(document.documentElement.dataset.theme).toBe('dark');
  await userEvent.click(screen.getByRole('button', { name: 'Giao diện: Tối' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /Sáng/ }));
  expect(await screen.findByRole('button', { name: 'Giao diện: Sáng' })).toBeInTheDocument();
  expect(document.documentElement.dataset.theme).toBe('light');
  delete document.documentElement.dataset.theme;
});
