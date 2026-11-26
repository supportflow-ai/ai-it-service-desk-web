import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { agentDirectory, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import type { SupportTeamDto } from '../model/supportTeam.types';
import { SupportTeamsManagementPage } from './SupportTeamsManagementPage';

const mockTeams: SupportTeamDto[] = [
  {
    id: 'team-triage',
    code: 'TRIAGE',
    name: 'Hàng đợi phân loại chung (Triage)',
    description: 'Tiếp nhận, phân loại và điều phối ban đầu',
    leadId: null,
    leadName: null,
    categories: ['OTHER'],
    memberCount: 2,
    isDefaultTriage: true,
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'team-network',
    code: 'NET',
    name: 'Đội Mạng & Hạ tầng',
    description: 'Chuyên trách hạ tầng mạng, switch, wifi, VPN',
    leadId: 'user-lead-net',
    leadName: 'Nguyễn Văn Mạng',
    categories: ['NET', 'VPN'],
    memberCount: 4,
    isDefaultTriage: false,
    status: 'active',
    createdAt: '2026-11-02T00:00:00Z',
  },
  {
    id: 'team-hardware',
    code: 'HW',
    name: 'Đội Phần cứng & Thiết bị',
    description: 'Bảo trì máy in, màn hình, cấp phát máy tính',
    leadId: null,
    leadName: null,
    categories: ['HW', 'PRINT', 'EQUIP'],
    memberCount: 1,
    isDefaultTriage: false,
    status: 'inactive',
    createdAt: '2026-11-03T00:00:00Z',
  },
];

function renderPage(roles = ['Admin']) {
  sessionStore.setToken('session');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })),
    http.get('http://localhost/api/support-teams', () => HttpResponse.json(mockTeams)),
    http.get('http://localhost/api/users', () => HttpResponse.json(agentDirectory)),
  );
  const { Wrapper } = createTestWrapper();
  return render(<SupportTeamsManagementPage />, { wrapper: Wrapper });
}

describe('SupportTeamsManagementPage', () => {
  it('renders support teams and statistics cards', async () => {
    renderPage(['Admin']);

    expect(screen.getByText('Quản lý Đội nhóm Hỗ trợ')).toBeInTheDocument();
    expect(await screen.findByText('Đội Mạng & Hạ tầng')).toBeInTheDocument();
    expect(screen.getAllByText('Hàng đợi phân loại chung (Triage)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Đội Phần cứng & Thiết bị')).toBeInTheDocument();

    // Statistics
    expect(screen.getByText('Tổng số đội nhóm')).toBeInTheDocument();
    expect(screen.getByText('Đội đang hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Tổng kỹ thuật viên')).toBeInTheDocument();
  });

  it('shows Thêm đội mới button for Admin and opens modal', async () => {
    renderPage(['Admin']);

    const addBtn = await screen.findByRole('button', { name: /Thêm đội mới/i });
    expect(addBtn).toBeInTheDocument();

    await userEvent.click(addBtn);
    expect(await screen.findByText('Thêm đội nhóm hỗ trợ mới')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên đội nhóm')).toBeInTheDocument();
    expect(screen.getByLabelText('Mã đội')).toBeInTheDocument();
  });

  it('hides Thêm đội mới button for non-Admin (e.g. Agent)', async () => {
    renderPage(['Agent']);

    expect(await screen.findByText('Đội Mạng & Hạ tầng')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Thêm đội mới/i })).not.toBeInTheDocument();
  });

  it('filters teams by search query', async () => {
    renderPage(['Admin']);

    expect(await screen.findByText('Đội Mạng & Hạ tầng')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên đội/i);
    await userEvent.type(searchInput, 'Mạng');

    await waitFor(() => {
      expect(screen.getByText('Đội Mạng & Hạ tầng')).toBeInTheDocument();
      expect(screen.queryByText('Đội Phần cứng & Thiết bị')).not.toBeInTheDocument();
    });
  });

  it('opens member drawer when clicking member button', async () => {
    server.use(
      http.get('http://localhost/api/support-teams/team-network/members', () =>
        HttpResponse.json([
          {
            userId: '00000000-0000-0000-0000-000000000005',
            fullName: 'Trần Thị Bình',
            role: 'Lead',
            joinedAt: '2026-11-05T00:00:00Z',
          },
        ]),
      ),
    );

    renderPage(['Admin']);

    expect(await screen.findByText('Đội Mạng & Hạ tầng')).toBeInTheDocument();
    const membersBtn = await screen.findByRole('button', { name: /Xem thành viên Đội Mạng & Hạ tầng/i });
    await userEvent.click(membersBtn);

    expect(await screen.findByText(/Thành viên: Đội Mạng & Hạ tầng/i)).toBeInTheDocument();
    expect(await screen.findByText('Trần Thị Bình')).toBeInTheDocument();
  });
});
