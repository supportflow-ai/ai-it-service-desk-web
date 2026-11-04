import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { agentDirectory, namedAgent, ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketCategory, TicketStatus } from '../model/ticket.types';
import { TicketAssignmentPanel } from './TicketAssignmentPanel';

function renderPanel(roles: string[], status: TicketStatus, onReload = () => {}, assignedToId: string | null = null) {
  sessionStore.setToken('session');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })),
    http.get('http://localhost/api/users', () => HttpResponse.json(agentDirectory)),
  );
  const { Wrapper } = createTestWrapper();
  render(<TicketAssignmentPanel ticket={{ ...ticketA, categoryId: TicketCategory.NET, status, assignedToId }} onReload={onReload} />, { wrapper: Wrapper });
}

it('lets an agent take an unassigned ticket with their own user id and the revision on screen', async () => {
  const bodies: unknown[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/assign`, async ({ request }) => {
    bodies.push(await request.json());
    return HttpResponse.json({ ...ticketA, status: TicketStatus.Assigned });
  }));
  renderPanel(['Agent'], TicketStatus.Submitted);
  expect(screen.getByText('Chưa phân công')).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: /Nhận về tôi/ }));
  await waitFor(() => expect(bodies).toEqual([{ agentId: user.userId, expectedRevision: ticketA.revision }]));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('lets staff unassign an assigned ticket after confirmation', async () => {
  const sent: (string | null)[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/unassign`, ({ request }) => {
    sent.push(new URL(request.url).searchParams.get('expectedRevision'));
    return HttpResponse.json({ ...ticketA, status: TicketStatus.Submitted });
  }));
  renderPanel(['Admin'], TicketStatus.Assigned, undefined, namedAgent.userId);
  await userEvent.click(await screen.findByRole('button', { name: /Hủy phân công/ }));
  expect(sent).toEqual([]);
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận hủy phân công' }));
  await waitFor(() => expect(sent).toEqual([String(ticketA.revision)]));
});

it('does not overwrite an assignment made from another screen: a stale take asks for a reload', async () => {
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/assign`, () => (
    HttpResponse.json({ error: 'Dữ liệu đã bị thay đổi bởi người khác.' }, { status: 409 })
  )));
  const onReload = vi.fn();
  renderPanel(['Agent'], TicketStatus.Submitted, onReload);
  await userEvent.click(await screen.findByRole('button', { name: /Nhận về tôi/ }));
  expect(await screen.findByText(/Ticket vừa được người khác cập nhật/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
  expect(screen.queryByText(/Ticket vừa được người khác cập nhật/)).not.toBeInTheDocument();
});

it('lets an admin take an unassigned ticket, as the backend allows', async () => {
  renderPanel(['Admin'], TicketStatus.Submitted);
  expect(await screen.findByRole('button', { name: /Nhận về tôi/ })).toBeEnabled();
});

it('offers neither self-assign nor unassign on an in-progress ticket', async () => {
  renderPanel(['Agent'], TicketStatus.InProgress);
  expect(await screen.findByRole('combobox', { name: 'Giao cho kỹ thuật viên' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nhận về tôi|Hủy phân công/ })).not.toBeInTheDocument();
});

it('offers no assignment change on a closed ticket', async () => {
  renderPanel(['Admin'], TicketStatus.Closed);
  expect(await screen.findByText(/Không có thao tác phân công/)).toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Giao cho kỹ thuật viên' })).not.toBeInTheDocument();
});

it('names the assignee from the agent directory', async () => {
  renderPanel(['Agent'], TicketStatus.Assigned, undefined, namedAgent.userId);
  expect(await screen.findByText('Trần Thị Bình')).toBeInTheDocument();
});

it('assigns to an agent chosen by name, with the revision on screen', async () => {
  const bodies: unknown[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/assign`, async ({ request }) => {
    bodies.push(await request.json());
    return HttpResponse.json({ ...ticketA, status: TicketStatus.Assigned, assignedToId: namedAgent.userId });
  }));
  renderPanel(['Agent'], TicketStatus.Submitted);
  expect(await screen.findByRole('button', { name: /Giao việc/ })).toBeDisabled();
  await userEvent.click(screen.getByRole('combobox', { name: 'Giao cho kỹ thuật viên' }));
  // An agent without a name is still listed, told apart by the start of their id.
  expect(await screen.findByTitle('Kỹ thuật viên chưa có tên (00000000)')).toBeInTheDocument();
  await userEvent.click(screen.getByTitle('Trần Thị Bình'));
  await userEvent.click(screen.getByRole('button', { name: /Giao việc/ }));
  await waitFor(() => expect(bodies).toEqual([{ agentId: namedAgent.userId, expectedRevision: ticketA.revision }]));
});

it('explains when the agent directory cannot be loaded', async () => {
  renderPanel(['Agent'], TicketStatus.Submitted);
  server.use(http.get('http://localhost/api/users', () => new HttpResponse(null, { status: 403 })));
  expect(await screen.findByText('Không tải được danh sách kỹ thuật viên.')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Giao cho kỹ thuật viên' })).toBeDisabled();
});

it('explains a rejected assignment and offers a reload', async () => {
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/assign`, () => (
    HttpResponse.json({ error: 'Cannot assign ticket in status Closed' }, { status: 400 })
  )));
  const onReload = vi.fn();
  renderPanel(['Agent'], TicketStatus.Submitted, onReload);
  await userEvent.click(await screen.findByRole('button', { name: /Nhận về tôi/ }));
  expect(await screen.findByText(/Không thể thay đổi phân công/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
});
