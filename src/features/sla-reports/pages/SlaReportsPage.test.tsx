import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { SlaReportsPage } from './SlaReportsPage';

function renderPage(roles: string[]) {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  return render(<SlaReportsPage />, { wrapper: Wrapper });
}

describe('SlaReportsPage', () => {
  it('explains the report is unsupported and locks filters and export for Admin', async () => {
    renderPage(['Admin']);

    expect(await screen.findByText('Báo cáo SLA chưa được hỗ trợ')).toBeInTheDocument();
    expect(screen.getByText(/Chưa có dữ liệu báo cáo SLA/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xuất báo cáo/ })).toBeDisabled();
    for (const label of ['Đội nhóm hỗ trợ (chưa hỗ trợ)', 'Mức ưu tiên (chưa hỗ trợ)']) {
      const controls = screen.getAllByLabelText(label);
      expect(controls.length).toBeGreaterThan(0);
      const select = controls[0]?.closest('.ant-select') ?? null;
      expect(select).not.toBeNull();
      expect(select).toHaveClass('ant-select-disabled');
    }
  });

  it('denies access to non-Admin roles', async () => {
    renderPage(['Agent']);

    expect(await screen.findByText('Không có quyền truy cập')).toBeInTheDocument();
    expect(screen.queryByText('Báo cáo SLA chưa được hỗ trợ')).not.toBeInTheDocument();
  });
});
