import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ForgotPasswordPage } from './ForgotPasswordPage';

function renderForgotPassword() {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

it('requests OTP and resets password successfully', async () => {
  server.use(
    http.post('http://localhost/api/auth/forgot-password', () =>
      HttpResponse.json({ message: 'Mã OTP đã được gửi.' }),
    ),
    http.post('http://localhost/api/auth/reset-password', () =>
      HttpResponse.json({ message: 'Đặt lại mật khẩu thành công.' }),
    ),
  );

  renderForgotPassword();

  // Step 1: Request OTP
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Gửi mã OTP' }));

  // Step 2: Enter OTP and new password
  expect(await screen.findByLabelText('Mã OTP')).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Mã OTP'), '123456');
  await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'NewPassword123');
  await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPassword123');
  await userEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

  // Step 3: Success state
  expect(await screen.findByText('Đặt lại mật khẩu thành công')).toBeInTheDocument();
});

it('shows an error when confirmation password does not match', async () => {
  server.use(
    http.post('http://localhost/api/auth/forgot-password', () =>
      HttpResponse.json({ message: 'Mã OTP đã được gửi.' }),
    ),
  );

  renderForgotPassword();

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Gửi mã OTP' }));

  expect(await screen.findByLabelText('Mã OTP')).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Mã OTP'), '123456');
  await userEvent.type(screen.getByLabelText('Mật khẩu mới'), 'NewPassword123');
  await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'DifferentPassword123');
  await userEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

  expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
});
