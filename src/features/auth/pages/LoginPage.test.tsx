import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { sessionStore } from '../lib/sessionStore';
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

it('asks the person to wait when the backend rate limits sign-in, without blaming the password', async () => {
  server.use(http.post('http://localhost/api/auth/login', () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '30' } })));
  renderLogin();
  await signIn();
  expect(await screen.findByText('Bạn thao tác quá nhanh. Vui lòng đợi một lúc rồi thử lại.')).toBeInTheDocument();
  expect(screen.queryByText(/Email hoặc mật khẩu không đúng/)).not.toBeInTheDocument();
});

it('keeps the generic message for a server failure', async () => {
  server.use(http.post('http://localhost/api/auth/login', () => new HttpResponse(null, { status: 500 })));
  renderLogin();
  await signIn();
  expect(await screen.findByText('Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.')).toBeInTheDocument();
});

it('moves focus to the first field that failed validation, so a keyboard user can fix it at once', async () => {
  renderLogin();
  await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByText('Vui lòng nhập Email.')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus());
});

it('labels the sign-in fields for password managers: username and current-password', () => {
  renderLogin();
  expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
  expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('autocomplete', 'current-password');
});

it('says why the person is back at sign-in when their session expired, and not on a first visit', async () => {
  renderLogin();
  expect(screen.queryByText(/Phiên đăng nhập đã hết hạn/)).not.toBeInTheDocument();
});

it('shows the expiry notice after the server ended the session, and drops it once signed in again', async () => {
  server.use(http.post('http://localhost/api/auth/login', () => HttpResponse.json({ token: 'again', user: { userId: 'u', email: 'an@example.com', fullName: null, roles: ['Requester'] } })));
  sessionStore.setTokens('old', 'old-refresh');
  const { token, version } = sessionStore.getSnapshot();
  if (!token) throw new Error('token missing');
  sessionStore.expire(token, version);
  renderLogin();
  expect(await screen.findByText('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.')).toBeInTheDocument();
  await signIn();
  expect(await screen.findByText('home page')).toBeInTheDocument();
});

