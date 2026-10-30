import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketCategory, TicketStatus } from '../model/ticket.types';
import { TicketCommandPanel } from './TicketCommandPanel';

function renderPanel(roles: string[], status: TicketStatus, onReload = () => {}) {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const ticket = { ...ticketA, categoryId: TicketCategory.NET, status };
  const { Wrapper } = createTestWrapper();
  render(<TicketCommandPanel ticket={ticket} onReload={onReload} />, { wrapper: Wrapper });
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

it('lets admin close or reopen a resolved ticket and never shows claim', async () => {
  renderPanel(['Admin'], TicketStatus.Resolved);
  expect(await screen.findByRole('button', { name: /Đóng vé/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mở lại vé/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nhận xử lý/ })).not.toBeInTheDocument();
});

it('lets the requester cancel their submitted ticket after confirmation', async () => {
  const calls: string[] = [];
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/cancel`, () => {
    calls.push('cancel');
    return HttpResponse.json({ ...ticketA, status: TicketStatus.Cancelled });
  }));
  renderPanel(['Requester'], TicketStatus.Submitted);
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
  renderPanel(['Agent'], TicketStatus.Submitted, onReload);
  await userEvent.click(await screen.findByRole('button', { name: /Nhận xử lý/ }));
  expect(await screen.findByText(/Không thể chuyển trạng thái/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
  expect(claims).toBe(1);
});

it('reports a permission failure without the generic retry message', async () => {
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/claim`, () => new HttpResponse(null, { status: 403 })));
  renderPanel(['Agent'], TicketStatus.Submitted);
  await userEvent.click(await screen.findByRole('button', { name: /Nhận xử lý/ }));
  expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này trên ticket.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Tải lại' })).not.toBeInTheDocument();
});
