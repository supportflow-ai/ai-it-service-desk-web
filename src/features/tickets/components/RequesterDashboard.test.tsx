import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketStatus } from '../model/ticket.types';
import { RequesterDashboard } from './RequesterDashboard';

let requested: Record<string, string>[] = [];

function serveMine(items: (typeof ticketA)[], totalCount = items.length) {
  server.use(http.get('http://localhost/api/tickets/me', ({ request }) => {
    requested.push(Object.fromEntries(new URL(request.url).searchParams));
    return HttpResponse.json({ items, page: 1, pageSize: 100, totalCount });
  }));
}

function renderDashboard() {
  const { Wrapper } = createTestWrapper();
  render(<MemoryRouter><RequesterDashboard knowledgePanel={<p>knowledge card</p>} /></MemoryRouter>, { wrapper: Wrapper });
}

function stat(label: string) {
  return screen.getByText(label).previousElementSibling?.textContent;
}

beforeEach(() => {
  requested = [];
  sessionStore.setToken('requester');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)));
});

it('shows a new account an empty state, never sample tickets or invented counts', async () => {
  serveMine([]);
  renderDashboard();
  expect(await screen.findByText('Bạn chưa có yêu cầu nào.')).toBeInTheDocument();
  expect(screen.queryByText(/INC-2026-/)).not.toBeInTheDocument();
  expect(stat('Chờ tiếp nhận')).toBe('0');
  expect(stat('Đang được xử lý')).toBe('0');
  expect(stat('Đã giải quyết gần đây')).toBe('0');
});

it('lists only the account own tickets and counts them by status', async () => {
  const ticket = (n: number, status: TicketStatus) => ({ ...ticketA, id: `10000000-0000-0000-0000-00000000010${n}`, ticketNumber: `IT-2026-010${n}`, status });
  serveMine([
    ticket(1, TicketStatus.Submitted),
    ticket(2, TicketStatus.Assigned),
    ticket(3, TicketStatus.PendingUser),
    ticket(4, TicketStatus.Resolved),
    ticket(5, TicketStatus.Closed),
    ticket(6, TicketStatus.Cancelled),
  ]);
  renderDashboard();
  expect(await screen.findByText('IT-2026-0101')).toBeInTheDocument();
  expect(screen.queryByText('IT-2026-0106')).not.toBeInTheDocument();
  expect(stat('Chờ tiếp nhận')).toBe('1');
  expect(stat('Đang được xử lý')).toBe('2');
  expect(stat('Đã giải quyết gần đây')).toBe('2');
  expect(requested).toEqual([{ page: '1', pageSize: '100' }]);
});

it('says the counts cover only the most recent tickets when the account has more', async () => {
  serveMine([ticketA], 250);
  renderDashboard();
  expect(await screen.findByText('Tính trên 1 yêu cầu gần nhất trong tổng số 250.')).toBeInTheDocument();
});

it('reports a failed load instead of filling the page with sample data', async () => {
  server.use(http.get('http://localhost/api/tickets/me', () => new HttpResponse(null, { status: 500 })));
  renderDashboard();
  // The list waits for the session restore first, which leaves the error state close to the 1 s default.
  expect(await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.queryByText(/INC-2026-/)).not.toBeInTheDocument();
  expect(screen.queryByText('Chờ tiếp nhận')).not.toBeInTheDocument();
});

it('hosts the knowledge base card it is given, and invents no articles of its own', async () => {
  serveMine([]);
  renderDashboard();
  expect(await screen.findByText('knowledge card')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Kho tri thức' })).toBeInTheDocument();
  expect(screen.queryByText(/VPN trên Windows 11/)).not.toBeInTheDocument();
});
