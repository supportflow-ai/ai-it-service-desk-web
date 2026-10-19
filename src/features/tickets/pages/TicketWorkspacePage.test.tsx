import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketWorkspacePage } from './TicketWorkspacePage';

it('shows explicit unsupported sections and never enables unconfirmed commands', async () => {
  sessionStore.setToken('admin');
  const requests: string[] = [];
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Admin'] })),
    http.get(`http://localhost/api/tickets/${ticketA.id}`, ({ request }) => { requests.push(new URL(request.url).pathname); return HttpResponse.json(ticketA); }),
  );
  const { Wrapper } = createTestWrapper();
  render(<MemoryRouter initialEntries={[`/agent-workspace/tickets/${ticketA.id}`]}>
    <Routes><Route path="/agent-workspace/tickets/:id" element={<TicketWorkspacePage />} /></Routes>
  </MemoryRouter>, { wrapper: Wrapper });
  expect(await screen.findByRole('heading', { name: ticketA.title })).toBeInTheDocument();
  expect(screen.getByText('Lịch sử xử lý chưa được hỗ trợ.')).toBeInTheDocument();
  for (const name of ['Nhận xử lý', 'Bắt đầu xử lý', 'Giải quyết', 'Gửi bình luận', 'Đính kèm file']) {
    expect(screen.getByRole('button', { name })).toBeDisabled();
  }
  expect(screen.queryByText('Ticket được tạo mới')).not.toBeInTheDocument();
  expect(requests).toEqual([`/api/tickets/${ticketA.id}`]);
});
