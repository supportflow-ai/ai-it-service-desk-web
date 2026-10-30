import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user, timelineItemA } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketStatus } from '../model/ticket.types';
import { TicketWorkspacePage } from './TicketWorkspacePage';

let requests: string[] = [];

function renderAt(ticketId: string) {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[`/agent-workspace/tickets/${ticketId}`]}>
      <Routes><Route path="/agent-workspace/tickets/:id" element={<TicketWorkspacePage />} /></Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

function renderWorkspace(ticket: typeof ticketA = ticketA) {
  server.use(
    http.get(`http://localhost/api/tickets/${ticket.id}`, ({ request }) => {
      requests.push(new URL(request.url).pathname);
      return HttpResponse.json(ticket);
    }),
    http.get(`http://localhost/api/tickets/${ticket.id}/timeline`, ({ request }) => {
      requests.push(new URL(request.url).pathname);
      return HttpResponse.json([timelineItemA]);
    }),
  );
  renderAt(ticket.id);
}

function sidebarField(label: string) {
  const card = screen.getByText('Thông tin ticket').closest<HTMLElement>('.ant-card');
  if (!card) throw new Error('Ticket info card is missing');
  const term = within(card).getByText(label, { selector: 'dt' });
  const value = term.nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error(`No value for ${label}`);
  return value;
}

beforeEach(() => {
  requests = [];
  sessionStore.setToken('agent');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })));
});

it('renders workspace with real ticket data and dynamic timeline', async () => {
  renderWorkspace();
  expect(await screen.findByRole('heading', { name: ticketA.title })).toBeInTheDocument();
  expect(await screen.findByText(timelineItemA.content)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Nhận xử lý/i })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Gửi bình luận/i })).toBeDisabled();
  expect(requests).toEqual([`/api/tickets/${ticketA.id}`, `/api/tickets/${ticketA.id}/timeline`]);
});

it('lays out only metadata the backend returns, without invented values', async () => {
  renderWorkspace();
  await screen.findByRole('heading', { name: ticketA.title });
  expect(within(sidebarField('Mã ticket')).getByText(ticketA.ticketNumber)).toBeInTheDocument();
  expect(sidebarField('Danh mục')).toHaveTextContent('Mạng & Wi-Fi');
  expect(sidebarField('Người yêu cầu')).toHaveTextContent('Chưa có thông tin');
  expect(sidebarField('Phụ trách')).toHaveTextContent('Chưa phân công');
  expect(screen.queryByText(/P\d — /)).not.toBeInTheDocument();
  expect(screen.queryByText('Ưu tiên')).not.toBeInTheDocument();
});

it('derives the assignee state from the status only where the domain makes it certain', async () => {
  renderWorkspace({ ...ticketA, status: TicketStatus.Assigned });
  await screen.findByRole('heading', { name: ticketA.title });
  expect(sidebarField('Phụ trách')).toHaveTextContent('Đã phân công');
});

it('does not guess the assignee of an in-progress ticket', async () => {
  renderWorkspace({ ...ticketA, status: TicketStatus.InProgress });
  await screen.findByRole('heading', { name: ticketA.title });
  expect(sidebarField('Phụ trách')).toHaveTextContent('Chưa có thông tin');
});

it('runs the whole agent flow on one screen: self-assign, claim, comment, resolve', async () => {
  let status = TicketStatus.Submitted;
  const timeline: (typeof timelineItemA)[] = [];
  const current = () => HttpResponse.json({ ...ticketA, status });
  server.use(
    http.get(`http://localhost/api/tickets/${ticketA.id}`, current),
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json(timeline)),
    http.post(`http://localhost/api/tickets/${ticketA.id}/assign`, () => { status = TicketStatus.Assigned; return current(); }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/claim`, () => { status = TicketStatus.InProgress; return current(); }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/resolve`, () => { status = TicketStatus.Resolved; return current(); }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/comments`, async ({ request }) => {
      const body = await request.json();
      const content = typeof body === 'object' && body !== null && 'content' in body ? String(body.content) : '';
      const item = { ...timelineItemA, id: `20000000-0000-0000-0000-00000000000${timeline.length + 2}`, content };
      timeline.push(item);
      return HttpResponse.json(item, { status: 201 });
    }),
  );
  renderAt(ticketA.id);

  await userEvent.click(await screen.findByRole('button', { name: /Nhận về tôi/ }));
  await waitFor(() => expect(sidebarField('Phụ trách')).toHaveTextContent('Đã phân công'));

  await userEvent.click(screen.getByRole('button', { name: /Nhận xử lý/ }));
  expect(await screen.findByRole('button', { name: /Giải quyết/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nhận về tôi/ })).not.toBeInTheDocument();

  await userEvent.type(screen.getByRole('textbox', { name: 'Nội dung bình luận' }), 'Đã kiểm tra cấu hình VPN');
  await userEvent.click(screen.getByRole('button', { name: 'Gửi bình luận' }));
  expect(await screen.findByText('Đã kiểm tra cấu hình VPN')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Giải quyết/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận giải quyết' }));
  await waitFor(() => expect(sidebarField('Trạng thái')).toHaveTextContent('Đã giải quyết'));
  expect(screen.getByText(/Không có thao tác nào khả dụng/)).toBeInTheDocument();
});
