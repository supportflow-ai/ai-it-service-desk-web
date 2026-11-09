import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { agentDirectory, namedAgent, ticketA, ticketB, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { AgentQueuePage } from './AgentQueuePage';
import { TicketWorkspacePage } from './TicketWorkspacePage';

let requests: Record<string, string>[] = [];
let queueStatus = 200;

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderQueue(entry = '/agent-workspace', workspace = <p>Workspace opened</p>) {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/agent-workspace" element={<AgentQueuePage />} />
        <Route path="/agent-workspace/tickets/:id" element={workspace} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  requests = [];
  queueStatus = 200;
  sessionStore.setToken('agent');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })),
    http.get('http://localhost/api/tickets/queue', ({ request }) => {
      requests.push(Object.fromEntries(new URL(request.url).searchParams));
      if (queueStatus !== 200) return new HttpResponse(null, { status: queueStatus });
      return HttpResponse.json({ items: [ticketA, ticketB], page: Number(new URL(request.url).searchParams.get('page')), pageSize: 10, totalCount: 25 });
    }),
  );
});

it('opens on the unassigned queue from the real queue endpoint', async () => {
  renderQueue();
  expect(await screen.findByText(ticketA.ticketNumber)).toBeInTheDocument();
  expect(requests).toEqual([{ page: '1', pageSize: '10', scope: 'unassigned' }]);
  expect(screen.getByRole('tab', { name: /Chưa phân công \(25\)/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('1–10 trên 25 ticket')).toBeInTheDocument();
});

it('tells an Agent their queue only holds their team tickets and ones assigned to them', async () => {
  server.use(http.get('http://localhost/api/tickets/queue', () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0 })));
  renderQueue();
  expect(await screen.findByText(/Bạn chỉ thấy ticket thuộc nhóm hỗ trợ của mình hoặc được giao trực tiếp/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: /Tất cả/ }));
  expect(await screen.findByText('Ticket thuộc nhóm hỗ trợ của bạn hoặc được giao trực tiếp cho bạn.')).toBeInTheDocument();
  expect(screen.queryByText('Toàn bộ ticket trong hệ thống.')).not.toBeInTheDocument();
});

it('keeps the whole-system wording for an Admin, who reads every ticket', async () => {
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Admin'] })),
    http.get('http://localhost/api/tickets/queue', () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0 })),
  );
  renderQueue();
  expect(await screen.findByText('Không có ticket nào phù hợp với bộ lọc.')).toBeInTheDocument();
  expect(screen.queryByText(/chỉ thấy ticket thuộc nhóm/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: /Tất cả/ }));
  expect(await screen.findByText('Toàn bộ ticket trong hệ thống.')).toBeInTheDocument();
});

it('switches scope and filters by status, restarting from page 1', async () => {
  renderQueue();
  await screen.findByText(ticketA.ticketNumber);
  await userEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(requests.at(-1)).toMatchObject({ page: '2' }));

  await userEvent.click(screen.getByRole('tab', { name: /Tất cả/ }));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10' }));

  await userEvent.click(screen.getByRole('combobox', { name: 'Trạng thái' }));
  await userEvent.click(await screen.findByTitle('Đang xử lý'));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', status: '2' }));

  await userEvent.click(screen.getByRole('tab', { name: /Của tôi/ }));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', scope: 'my', status: '2' }));
  expect(screen.getByText(/Ticket đang giao cho bạn/)).toBeInTheDocument();
});

it('shows who handles each ticket: a name from the directory, or that nobody does yet', async () => {
  server.use(
    http.get('http://localhost/api/users', () => HttpResponse.json(agentDirectory)),
    http.get('http://localhost/api/tickets/queue', () => HttpResponse.json({
      items: [{ ...ticketA, assignedToId: namedAgent.userId }, ticketB], page: 1, pageSize: 10, totalCount: 2,
    })),
  );
  renderQueue();
  const assigned = (await screen.findByText(ticketA.ticketNumber)).closest('tr');
  const unassigned = (await screen.findByText(ticketB.ticketNumber)).closest('tr');
  if (!assigned || !unassigned) throw new Error('Queue rows are missing');
  expect(screen.getByRole('columnheader', { name: 'Người xử lý' })).toBeInTheDocument();
  expect(await within(assigned).findByText(namedAgent.fullName)).toBeInTheDocument();
  expect(within(unassigned).getByText('Chưa phân công')).toBeInTheDocument();
});

it('names an Admin who took a ticket, not only the agents', async () => {
  const admin = { userId: '00000000-0000-0000-0000-000000000007', fullName: 'Lê Văn Quản Trị' };
  server.use(
    http.get('http://localhost/api/users', ({ request }) => HttpResponse.json(
      new URL(request.url).searchParams.get('role') === 'Admin' ? [admin] : agentDirectory,
    )),
    http.get('http://localhost/api/tickets/queue', () => HttpResponse.json({
      items: [{ ...ticketA, assignedToId: admin.userId }], page: 1, pageSize: 10, totalCount: 1,
    })),
  );
  renderQueue();
  const row = (await screen.findByText(ticketA.ticketNumber)).closest('tr');
  if (!row) throw new Error('Queue row is missing');
  expect(await within(row).findByText(admin.fullName)).toBeInTheDocument();
});

it('shows the priority of each ticket, filters by it and sorts highest priority first', async () => {
  renderQueue();
  const row = (await screen.findByText(ticketA.ticketNumber)).closest('tr');
  if (!row) throw new Error('Queue row is missing');
  expect(within(row).getByText('P3 · Trung bình')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('combobox', { name: 'Ưu tiên' }));
  await userEvent.click(await screen.findByTitle('P1 · Khẩn cấp'));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', scope: 'unassigned', priority: 'P1' }));

  await userEvent.click(screen.getByRole('combobox', { name: 'Sắp xếp' }));
  await userEvent.click(await screen.findByTitle('Sắp xếp: ưu tiên cao trước'));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', scope: 'unassigned', priority: 'P1', sortByPriority: 'true' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/agent-workspace?priority=P1&sort=priority');
});

it('opens the ticket workspace from a row', async () => {
  renderQueue();
  const row = (await screen.findByText(ticketB.ticketNumber)).closest('tr');
  if (!row) throw new Error('Queue row is missing');
  await userEvent.click(within(row).getByText(ticketB.title));
  expect(await screen.findByText('Workspace opened')).toBeInTheDocument();
});

it('shows a permission error without any rows', async () => {
  queueStatus = 403;
  renderQueue();
  expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này.')).toBeInTheDocument();
  expect(screen.queryByText(ticketA.ticketNumber)).not.toBeInTheDocument();
});

it('restores filters from the URL and writes filter changes back to it', async () => {
  renderQueue('/agent-workspace?scope=all&status=2&page=2');
  await screen.findByText(ticketA.ticketNumber);
  expect(requests[0]).toEqual({ page: '2', pageSize: '10', status: '2' });
  expect(screen.getByRole('tab', { name: /Tất cả/ })).toHaveAttribute('aria-selected', 'true');

  await userEvent.click(screen.getByRole('tab', { name: /Chưa phân công/ }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/agent-workspace?status=2'));
});

it('returns from the workspace to the same filtered queue', async () => {
  server.use(
    http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json(ticketA)),
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([])),
    http.get(`http://localhost/api/tickets/${ticketA.id}/attachments`, () => HttpResponse.json([])),
    http.get('http://localhost/api/users', () => HttpResponse.json(agentDirectory)),
  );
  renderQueue('/agent-workspace?scope=all&category=NET', <TicketWorkspacePage />);
  await userEvent.click(await screen.findByRole('link', { name: `Mở ticket ${ticketA.ticketNumber}` }));
  expect(await screen.findByRole('heading', { name: ticketA.title })).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent(`/agent-workspace/tickets/${ticketA.id}`);

  await userEvent.click(screen.getByRole('link', { name: /Quay lại hàng đợi/ }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/agent-workspace?scope=all&category=NET'));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', category: 'NET' }));
});
