import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../tests/render';
import { server } from '../../../tests/mocks/server';
import { user } from '../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { RootRoute } from '../router/RootRoute';
import { Route, Routes } from 'react-router-dom';
import { LandingPage } from './LandingPage';

function renderLanding() {
  const { Wrapper } = createTestWrapper();
  render(<MemoryRouter><LandingPage /></MemoryRouter>, { wrapper: Wrapper });
}

beforeEach(() => sessionStore.clear());

it('has one main heading and lets a visitor sign in or register', () => {
  renderLanding();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Gửi yêu cầu IT một lần, theo dõi đến khi xong');
  const main = screen.getByRole('main');
  expect(within(main).getAllByRole('link', { name: 'Đăng nhập' })[0]).toHaveAttribute('href', '/login');
  expect(within(main).getAllByRole('link', { name: /Tạo tài khoản/ })[0]).toHaveAttribute('href', '/register');
  expect(screen.getByRole('link', { name: 'Bỏ qua tới nội dung' })).toHaveAttribute('href', '#noi-dung');
});

it('offers the section links and each target exists', () => {
  renderLanding();
  const nav = screen.getByRole('navigation', { name: 'Các phần của trang' });
  for (const link of within(nav).getAllByRole('link')) {
    const id = link.getAttribute('href')?.slice(1) ?? '';
    expect(document.getElementById(id)).not.toBeNull();
  }
});

it('marks AI suggestions and the knowledge base as coming soon, and shows no figures or customer claims', () => {
  renderLanding();
  const soon = screen.getAllByText('Sắp có');
  expect(soon).toHaveLength(2);
  expect(screen.getByRole('heading', { name: 'Gợi ý phân loại bằng AI' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Kho tri thức' })).toBeInTheDocument();
  // No invented proof: percentages, customer counts or uptime.
  expect(screen.queryByText(/\d+\s*%/)).not.toBeInTheDocument();
  expect(screen.queryByText(/khách hàng|uptime|SLA/i)).not.toBeInTheDocument();
});

it('hides the decorative queue preview from assistive technology', () => {
  renderLanding();
  expect(screen.getByText('Đang xử lý').closest('[aria-hidden="true"]')).not.toBeNull();
});

function renderRoot() {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RootRoute />}>
          <Route index element={<p>overview page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

it('shows the landing page at / to someone who is not signed in', async () => {
  renderRoot();
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Gửi yêu cầu IT');
  expect(screen.queryByText('overview page')).not.toBeInTheDocument();
});

it('continues into the app at / once signed in', async () => {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Requester'] })));
  renderRoot();
  expect(await screen.findByText('overview page')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
});
