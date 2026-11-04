import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { RegisterPage } from './RegisterPage';

function renderRegister() {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

async function fillAndSubmit(password: string) {
  await userEvent.type(screen.getByLabelText('Họ và tên'), 'Nguyễn Văn An');
  await userEvent.type(screen.getByLabelText('Email'), 'an@example.com');
  await userEvent.type(screen.getByLabelText('Mật khẩu'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
}

it('rejects a password the backend would refuse before sending anything', async () => {
  // Any request here would fail the test through the unhandled-request guard.
  renderRegister();
  await fillAndSubmit('abc12345');
  expect(await screen.findByText(/ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số/)).toBeInTheDocument();
});

it('says the email is already registered instead of a generic error', async () => {
  server.use(http.post('http://localhost/api/auth/register', () => (
    HttpResponse.json({ errors: ['Email is already registered.'] }, { status: 400 })
  )));
  renderRegister();
  await fillAndSubmit('Abcdefg1');
  expect(await screen.findByText(/Email này đã được đăng ký/)).toBeInTheDocument();
  expect(screen.queryByText('login page')).not.toBeInTheDocument();
});

it('sends the registration and goes to the login page', async () => {
  const sent: unknown[] = [];
  server.use(http.post('http://localhost/api/auth/register', async ({ request }) => {
    sent.push(await request.json());
    return HttpResponse.json({
      token: 'new-token',
      user: { userId: '00000000-0000-0000-0000-000000000003', email: 'an@example.com', fullName: 'Nguyễn Văn An', roles: ['Requester'] },
    }, { status: 201 });
  }));
  renderRegister();
  await fillAndSubmit('Abcdefg1');
  expect(await screen.findByText('login page')).toBeInTheDocument();
  await waitFor(() => expect(sent).toEqual([{ email: 'an@example.com', password: 'Abcdefg1', fullName: 'Nguyễn Văn An' }]));
});
