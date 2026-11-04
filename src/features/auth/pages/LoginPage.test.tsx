import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { LoginPage } from './LoginPage';

function renderLogin() {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>home page</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

async function signIn() {
  await userEvent.type(screen.getByLabelText('Email'), 'an@example.com');
  await userEvent.type(screen.getByLabelText('Mật khẩu'), 'Abcdefg1');
  await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

it('says the email or password is wrong, and that repeated failures lock the account', async () => {
  // The backend answers a bare 401 for a wrong password and for a locked account alike.
  server.use(http.post('http://localhost/api/auth/login', () => new HttpResponse(null, { status: 401 })));
  renderLogin();
  await signIn();
  expect(await screen.findByText(/Email hoặc mật khẩu không đúng\. Nếu nhập sai 5 lần liên tiếp/)).toBeInTheDocument();
  expect(screen.queryByText(/phiên đăng nhập/)).not.toBeInTheDocument();
  expect(screen.queryByText('home page')).not.toBeInTheDocument();
});

it('keeps the generic message for a server failure', async () => {
  server.use(http.post('http://localhost/api/auth/login', () => new HttpResponse(null, { status: 500 })));
  renderLogin();
  await signIn();
  expect(await screen.findByText('Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.')).toBeInTheDocument();
});
