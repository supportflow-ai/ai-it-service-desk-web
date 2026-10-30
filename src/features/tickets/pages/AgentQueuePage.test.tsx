import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, ticketB, user } from '../../../../tests/fixtures';
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
  expect(screen.getByText(/hệ thống chưa lọc riêng theo người phụ trách/)).toBeInTheDocument();
});

it('keeps the unsupported priority filter locked', async () => {
  renderQueue();
  await screen.findByText(ticketA.ticketNumber);
  expect(screen.getByRole('combobox', { name: 'Ưu tiên' })).toBeDisabled();
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
  );
  renderQueue('/agent-workspace?scope=all&category=NET', <TicketWorkspacePage />);
  await userEvent.click(await screen.findByRole('link', { name: `Mở ticket ${ticketA.ticketNumber}` }));
  expect(await screen.findByRole('heading', { name: ticketA.title })).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent(`/agent-workspace/tickets/${ticketA.id}`);

  await userEvent.click(screen.getByRole('link', { name: /Quay lại hàng đợi/ }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/agent-workspace?scope=all&category=NET'));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', category: 'NET' }));
});
