import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import type { ServiceCategoryItemDto } from '../model/serviceCatalog.types';
import { ServiceCatalogManagementPage } from './ServiceCatalogManagementPage';

const mockCategories: ServiceCategoryItemDto[] = [
  {
    id: 'cat-net',
    code: 'NET',
    name: 'Mạng & Wi-Fi',
    description: 'Sự cố kết nối mạng internet và nội bộ',
    targetTeamId: 'team-net',
    targetTeamName: 'Đội Mạng & Hạ tầng',
    defaultPriority: 'P2',
    targetResolutionHours: 8,
    status: 'active',
    ticketCount: 15,
  },
  {
    id: 'cat-sw',
    code: 'SW',
    name: 'Cài đặt phần mềm',
    description: 'Yêu cầu cài đặt phần mềm bản quyền',
    targetTeamId: 'team-sw',
    targetTeamName: 'Đội Phần mềm',
    defaultPriority: 'P3',
    targetResolutionHours: 24,
    status: 'active',
    ticketCount: 8,
  },
  {
    id: 'cat-old',
    code: 'OLD',
    name: 'Dịch vụ Cũ',
    description: 'Không còn hỗ trợ',
    targetTeamId: null,
    targetTeamName: null,
    defaultPriority: 'P4',
    targetResolutionHours: 48,
    status: 'inactive',
    ticketCount: 0,
  },
];

function renderPage(roles = ['Admin']) {
  sessionStore.setToken('session');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })),
    http.get('http://localhost/api/service-catalog/categories', () => HttpResponse.json(mockCategories)),
    http.get('http://localhost/api/support-teams', () => HttpResponse.json([])),
  );
  const { Wrapper } = createTestWrapper();
  return render(<ServiceCatalogManagementPage />, { wrapper: Wrapper });
}

describe('ServiceCatalogManagementPage', () => {
  it('renders service categories and statistics cards for Admin', async () => {
    renderPage(['Admin']);

    expect(await screen.findByText('Quản lý Danh mục Dịch vụ')).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText('Mạng & Wi-Fi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cài đặt phần mềm').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Dịch vụ Cũ').length).toBeGreaterThanOrEqual(1);

    // Statistics
    expect(screen.getByText('Tổng số danh mục')).toBeInTheDocument();
    expect(screen.getAllByText('Đang cung cấp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Đã gán đội xử lý')).toBeInTheDocument();
  });

  it('shows access denied when user is not Admin (e.g. Agent)', async () => {
    renderPage(['Agent']);

    expect(await screen.findByText('Không có quyền truy cập')).toBeInTheDocument();
    expect(screen.queryByText('Thêm danh mục dịch vụ')).not.toBeInTheDocument();
  });

  it('filters categories by search query', async () => {
    renderPage(['Admin']);

    expect(await screen.findByText('Mạng & Wi-Fi')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên danh mục/i);
    await userEvent.type(searchInput, 'Phần mềm');

    await waitFor(() => {
      expect(screen.getByText('Cài đặt phần mềm')).toBeInTheDocument();
      expect(screen.queryByText('Mạng & Wi-Fi')).not.toBeInTheDocument();
    });
  });

  it('opens add category modal when clicking Thêm danh mục dịch vụ', async () => {
    renderPage(['Admin']);

    const addBtn = await screen.findByRole('button', { name: /Thêm danh mục dịch vụ/i });
    await userEvent.click(addBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên danh mục dịch vụ')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã danh mục/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Mức độ ưu tiên mặc định')).toBeInTheDocument();
  });
});
