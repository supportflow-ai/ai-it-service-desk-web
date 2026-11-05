import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { sessionStore } from '../lib/sessionStore';
import { AdminUsersPage } from './AdminUsersPage';

const mockAgents = [
  { userId: '11111111-1111-1111-1111-111111111111', fullName: 'Agent One' },
];
const mockAdmins = [
  { userId: '22222222-2222-2222-2222-222222222222', fullName: 'Admin Two' },
];

beforeEach(() => {
  sessionStore.clear();
});

function renderAdminUsersPage() {
  sessionStore.setToken('admin-session');
  server.use(
    http.get('http://localhost/api/auth/me', () =>
      HttpResponse.json({ ...user, roles: ['Admin'] }),
    ),
  );
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

it('displays users list and opens role assignment modal', async () => {
  server.use(
    http.get('http://localhost/api/users', ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get('role') === 'Agent') {
        return HttpResponse.json(mockAgents);
      }
      if (url.searchParams.get('role') === 'Admin') {
        return HttpResponse.json(mockAdmins);
      }
      return HttpResponse.json([]);
    }),
    http.put('http://localhost/api/users/:id/roles', () =>
      HttpResponse.json({ message: 'Cập nhật vai trò thành công.' }),
    ),
  );

  renderAdminUsersPage();

  expect(await screen.findByText('Agent One')).toBeInTheDocument();
  expect(screen.getByText('Admin Two')).toBeInTheDocument();

  // Click on "Phân quyền" for the first user
  const assignButtons = screen.getAllByRole('button', { name: 'Phân quyền' });
  await userEvent.click(assignButtons[0]!);

  // Modal appears
  expect(await screen.findByText('Chọn các vai trò áp dụng:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Lưu vai trò' })).toBeInTheDocument();

  // Save roles
  await userEvent.click(screen.getByRole('button', { name: 'Lưu vai trò' }));
  await waitFor(() =>
    expect(screen.queryByText('Chọn các vai trò áp dụng:')).not.toBeInTheDocument(),
  );
});
