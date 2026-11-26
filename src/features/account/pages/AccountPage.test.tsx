import { fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { AccountPage } from './AccountPage';

function renderPage(roles: string[]) {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  return render(<AccountPage />, { wrapper: Wrapper });
}

describe('AccountPage', () => {
  it('shows the account details and the role labels', async () => {
    renderPage(['Agent']);

    expect(await screen.findByText(user.email)).toBeInTheDocument();
    expect(screen.getByText('Kỹ thuật viên')).toBeInTheDocument();
  });

  it('opens the change password dialog', async () => {
    renderPage(['Requester']);

    fireEvent.click(await screen.findByRole('button', { name: /Đổi mật khẩu/ }));

    expect(await screen.findByText('Lưu mật khẩu')).toBeInTheDocument();
  });

  it('locks the language and notification preferences as unsupported', async () => {
    renderPage(['Requester']);

    expect(await screen.findByText('Tuỳ chọn ngôn ngữ và thông báo chưa được hỗ trợ')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Thông báo qua email (chưa hỗ trợ)' })).toBeDisabled();
    const select = screen.getAllByLabelText('Ngôn ngữ (chưa hỗ trợ)')[0]?.closest('.ant-select') ?? null;
    expect(select).toHaveClass('ant-select-disabled');
  });
});
