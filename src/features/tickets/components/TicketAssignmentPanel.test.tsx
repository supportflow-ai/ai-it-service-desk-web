import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketCategory, TicketStatus } from '../model/ticket.types';
import { TicketAssignmentPanel } from './TicketAssignmentPanel';

function renderPanel(roles: string[], status: TicketStatus, onReload = () => {}) {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  render(<TicketAssignmentPanel ticket={{ ...ticketA, categoryId: TicketCategory.NET, status }} onReload={onReload} />, { wrapper: Wrapper });
}

it('lets an agent take an unassigned ticket with their own user id', async () => {
  const bodies: unknown[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/assign`, async ({ request }) => {
    bodies.push(await request.json());
    return HttpResponse.json({ ...ticketA, status: TicketStatus.Assigned });
  }));
  renderPanel(['Agent'], TicketStatus.Submitted);
  expect(screen.getByText('Chưa phân công')).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: /Nhận về tôi/ }));
  await waitFor(() => expect(bodies).toEqual([{ agentId: user.userId }]));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('lets staff unassign an assigned ticket after confirmation', async () => {
  let unassigned = 0;
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/unassign`, () => {
    unassigned += 1;
    return HttpResponse.json({ ...ticketA, status: TicketStatus.Submitted });
  }));
  renderPanel(['Admin'], TicketStatus.Assigned);
  await userEvent.click(await screen.findByRole('button', { name: /Hủy phân công/ }));
  expect(unassigned).toBe(0);
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận hủy phân công' }));
  await waitFor(() => expect(unassigned).toBe(1));
});

it('never offers self-assign to an admin-only account or on a ticket already held', async () => {
  renderPanel(['Admin'], TicketStatus.Submitted);
  expect(await screen.findByText(/Không có thao tác phân công/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nhận về tôi/ })).not.toBeInTheDocument();
});

it('keeps choosing another agent locked and explains why', async () => {
  renderPanel(['Agent'], TicketStatus.Submitted);
  expect(screen.getByRole('combobox', { name: 'Giao cho kỹ thuật viên khác' })).toBeDisabled();
  expect(screen.getByText(/chưa có danh sách kỹ thuật viên/)).toBeInTheDocument();
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
