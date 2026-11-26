import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { agentDirectory, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import type { DepartmentItemDto } from '../model/department.types';
import { DepartmentsManagementPage } from './DepartmentsManagementPage';

const mockDepartments: DepartmentItemDto[] = [
  {
    id: 'dep-it',
    code: 'IT',
    name: 'Khối Công nghệ Thông tin',
    description: 'Vận hành và phát triển hệ thống CNTT',
    managerId: '00000000-0000-0000-0000-000000000005',
    managerName: 'Trần Thị Bình',
    employeeCount: 25,
    status: 'active',
  },
  {
    id: 'dep-hr',
    code: 'HR',
    name: 'Phòng Nhân sự',
    description: 'Chính sách và tuyển dụng nhân sự',
    managerId: null,
    managerName: null,
    employeeCount: 10,
    status: 'active',
  },
  {
    id: 'dep-old',
    code: 'OLD',
    name: 'Phòng Ban Cũ',
    description: 'Đã sáp nhập',
    managerId: null,
    managerName: null,
    employeeCount: 0,
    status: 'inactive',
  },
];

function renderPage(roles = ['Admin']) {
  sessionStore.setToken('session');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })),
    http.get('http://localhost/api/departments', () => HttpResponse.json(mockDepartments)),
    http.get('http://localhost/api/users', () => HttpResponse.json(agentDirectory)),
  );
  const { Wrapper } = createTestWrapper();
  return render(<DepartmentsManagementPage />, { wrapper: Wrapper });
}

describe('DepartmentsManagementPage', () => {
  it('renders departments and statistics cards for Admin', async () => {
    renderPage(['Admin']);

    expect(await screen.findByText('Quản lý Phòng ban')).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText('Khối Công nghệ Thông tin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Phòng Nhân sự').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Phòng Ban Cũ').length).toBeGreaterThanOrEqual(1);

    // Statistics
    expect(screen.getByText('Tổng số phòng ban')).toBeInTheDocument();
    expect(screen.getAllByText('Đang hoạt động').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tổng nhân sự trực thuộc')).toBeInTheDocument();
  });

  it('shows access denied when user is not Admin (e.g. Agent)', async () => {
    renderPage(['Agent']);

    expect(await screen.findByText('Không có quyền truy cập')).toBeInTheDocument();
    expect(screen.queryByText('Thêm phòng ban mới')).not.toBeInTheDocument();
  });

  it('filters departments by search query', async () => {
    renderPage(['Admin']);

    expect(await screen.findByText('Khối Công nghệ Thông tin')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên phòng ban/i);
    await userEvent.type(searchInput, 'Nhân sự');

    await waitFor(() => {
      expect(screen.getByText('Phòng Nhân sự')).toBeInTheDocument();
      expect(screen.queryByText('Khối Công nghệ Thông tin')).not.toBeInTheDocument();
    });
  });

  it('opens add department modal when clicking Thêm phòng ban mới', async () => {
    renderPage(['Admin']);

    const addBtn = await screen.findByRole('button', { name: /Thêm phòng ban mới/i });
    await userEvent.click(addBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên phòng ban')).toBeInTheDocument();
    expect(screen.getByLabelText('Mã phòng ban')).toBeInTheDocument();
  });
});
