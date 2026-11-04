import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketCategory, TicketStatus } from '../model/ticket.types';
import type { TicketView } from '../model/ticketPermissions';
import { TicketCommandPanel } from './TicketCommandPanel';

interface PanelOptions { view?: TicketView; onReload?: () => void; requesterId?: string }

function renderPanel(roles: string[], status: TicketStatus, { view = 'workspace', onReload = () => {}, requesterId = ticketA.requesterId }: PanelOptions = {}) {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const ticket = { ...ticketA, categoryId: TicketCategory.NET, status, requesterId };
  const { Wrapper } = createTestWrapper();
  render(<TicketCommandPanel ticket={ticket} onReload={onReload} view={view} />, { wrapper: Wrapper });
}

it('gives an agent claim on a submitted ticket but no owner-only commands', async () => {
  renderPanel(['Agent'], TicketStatus.Submitted);
  expect(await screen.findByRole('button', { name: /Nhận xử lý/ })).toBeEnabled();
  expect(screen.queryByRole('button', { name: /Hủy vé/ })).not.toBeInTheDocument();
});

it('does not offer close or reopen to a plain agent on a resolved ticket', async () => {
  renderPanel(['Agent'], TicketStatus.Resolved);
  expect(await screen.findByText(/Không có thao tác nào khả dụng/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Đóng vé/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Mở lại vé/ })).not.toBeInTheDocument();
});

it('lets admin close or reopen a resolved ticket they do not own', async () => {
  renderPanel(['Admin'], TicketStatus.Resolved);
  expect(await screen.findByRole('button', { name: /Đóng vé/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mở lại vé/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nhận xử lý/ })).not.toBeInTheDocument();
});

it('lets admin claim a submitted ticket, as the backend allows', async () => {
  renderPanel(['Admin'], TicketStatus.Submitted);
  expect(await screen.findByRole('button', { name: /Nhận xử lý/ })).toBeEnabled();
});

it('treats an agent viewing their own request as its requester: cancel, but no claim', async () => {
  renderPanel(['Agent'], TicketStatus.Submitted, { view: 'requester', requesterId: user.userId });
  expect(await screen.findByRole('button', { name: /Hủy vé/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nhận xử lý/ })).not.toBeInTheDocument();
});

it('keeps owner commands off the workspace for a plain agent, even on their own ticket', async () => {
  renderPanel(['Agent'], TicketStatus.Submitted, { requesterId: user.userId });
  expect(await screen.findByRole('button', { name: /Nhận xử lý/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Hủy vé/ })).not.toBeInTheDocument();
});

it('does not offer cancel to a requester who does not own the ticket', async () => {
  renderPanel(['Requester'], TicketStatus.Submitted, { view: 'requester' });
  expect(await screen.findByText(/Không có thao tác nào khả dụng/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Hủy vé/ })).not.toBeInTheDocument();
});

it('lets the requester cancel their submitted ticket after confirmation', async () => {
  const calls: string[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/cancel`, () => {
    calls.push('cancel');
    return HttpResponse.json({ ...ticketA, status: TicketStatus.Cancelled });
  }));
  renderPanel(['Requester'], TicketStatus.Submitted, { view: 'requester', requesterId: user.userId });
  await userEvent.click(await screen.findByRole('button', { name: /Hủy vé/ }));
  expect(calls).toEqual([]);
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận hủy' }));
  await waitFor(() => expect(calls).toEqual(['cancel']));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('explains a rejected transition and offers a reload instead of retrying', async () => {
  let claims = 0;
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/claim`, () => {
    claims += 1;
    return HttpResponse.json({ error: 'Cannot claim ticket in status InProgress' }, { status: 400 });
  }));
  const onReload = vi.fn();
  renderPanel(['Agent'], TicketStatus.Submitted, { onReload });
  await userEvent.click(await screen.findByRole('button', { name: /Nhận xử lý/ }));
  expect(await screen.findByText(/Không thể chuyển trạng thái/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
  expect(claims).toBe(1);
});

it('sends the revision on screen and asks for a reload when someone else changed the ticket', async () => {
  const sent: (string | null)[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/claim`, ({ request }) => {
    sent.push(new URL(request.url).searchParams.get('expectedRevision'));
    return HttpResponse.json({ error: 'Dữ liệu đã bị thay đổi bởi người khác.' }, { status: 409 });
  }));
  const onReload = vi.fn();
  renderPanel(['Agent'], TicketStatus.Submitted, { onReload });
  await userEvent.click(await screen.findByRole('button', { name: /Nhận xử lý/ }));
  expect(await screen.findByText(/Ticket vừa được người khác cập nhật/)).toBeInTheDocument();
  expect(sent).toEqual([String(ticketA.revision)]);

  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
  expect(screen.queryByText(/Ticket vừa được người khác cập nhật/)).not.toBeInTheDocument();
  expect(sent).toHaveLength(1);
});

it('explains a claim lost to another agent and offers a reload', async () => {
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/claim`, () => (
    HttpResponse.json({ error: 'Vé đã được phân công cho kỹ thuật viên khác.' }, { status: 403 })
  )));
  const onReload = vi.fn();
  renderPanel(['Agent'], TicketStatus.Submitted, { onReload });
  await userEvent.click(await screen.findByRole('button', { name: /Nhận xử lý/ }));
  expect(await screen.findByText(/ticket vừa được giao cho kỹ thuật viên khác/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
});
