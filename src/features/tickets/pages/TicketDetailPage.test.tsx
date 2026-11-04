import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, timelineItemA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketStatus } from '../model/ticket.types';
import { TicketDetailPage } from './TicketDetailPage';

const leakedNote = { ...timelineItemA, id: '20000000-0000-0000-0000-000000000009', content: 'Ghi chú bí mật', isInternal: true };
const ownTicket = { ...ticketA, requesterId: user.userId };

function renderRequesterPage() {
  const { Wrapper, queryClient } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[`/requester-dashboard/tickets/${ticketA.id}`]}>
      <Routes>
        <Route path="/requester-dashboard/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/agent-workspace/tickets/:id" element={<p>workspace page</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
  return queryClient;
}

beforeEach(() => {
  sessionStore.setToken('requester');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)),
    http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json(ownTicket)),
    http.get(`http://localhost/api/tickets/${ticketA.id}/attachments`, () => HttpResponse.json([])),
  );
});

it('lets the requester read the public timeline, but never internal notes or the internal composer', async () => {
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([timelineItemA, leakedNote])));
  renderRequesterPage();
  expect(await screen.findByText(timelineItemA.content)).toBeInTheDocument();
  expect(screen.queryByText(leakedNote.content)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Ghi chú nội bộ' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Hủy vé/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Đính kèm tệp/ })).toBeInTheDocument();
});

it('shows a staff member their own request as a requester: no internal notes, internal composer or staff commands', async () => {
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })),
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([timelineItemA, leakedNote])),
  );
  renderRequesterPage();
  expect(await screen.findByText(timelineItemA.content)).toBeInTheDocument();
  expect(screen.queryByText(leakedNote.content)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Ghi chú nội bộ' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nhận xử lý|Giải quyết/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Hủy vé/ })).toBeInTheDocument();
});

it('validates the comment length, sends a trimmed comment and refreshes the timeline', async () => {
  let timelineReads = 0;
  const sent: unknown[] = [];
  server.use(
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => {
      timelineReads += 1;
      return HttpResponse.json([]);
    }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/comments`, async ({ request }) => {
      const body = await request.json();
      sent.push(body);
      return HttpResponse.json({ ...timelineItemA, content: 'Xin chào' }, { status: 201 });
    }),
  );
  renderRequesterPage();
  const input = await screen.findByRole('textbox', { name: 'Nội dung bình luận' });
  const send = screen.getByRole('button', { name: 'Gửi bình luận' });

  await userEvent.type(input, 'a');
  expect(screen.getByText('Nội dung cần ít nhất 2 ký tự.')).toBeInTheDocument();
  expect(send).toBeDisabled();

  await userEvent.clear(input);
  await userEvent.type(input, '  Xin chào  ');
  await userEvent.click(send);

  await waitFor(() => expect(sent).toEqual([{ content: 'Xin chào' }]));
  await waitFor(() => expect(input).toHaveValue(''));
  await waitFor(() => expect(timelineReads).toBe(2));
});

it('keeps the typed comment and explains the failure when sending is rejected', async () => {
  server.use(
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([])),
    http.post(`http://localhost/api/tickets/${ticketA.id}/comments`, () => new HttpResponse(null, { status: 404 })),
  );
  renderRequesterPage();
  const input = await screen.findByRole('textbox', { name: 'Nội dung bình luận' });
  await userEvent.type(input, 'Vẫn chưa vào được mạng');
  await userEvent.click(screen.getByRole('button', { name: 'Gửi bình luận' }));
  const composer = screen.getByText('Soạn phản hồi').closest<HTMLElement>('.ant-card');
  if (!composer) throw new Error('Composer card is missing');
  expect(await within(composer).findByText(/Không tìm thấy ticket/)).toBeInTheDocument();
  expect(input).toHaveValue('Vẫn chưa vào được mạng');
});

it.each([
  [403, 'Bạn không có quyền xem ticket này'],
  [404, 'Không tìm thấy ticket'],
])('hides the cached ticket and its actions when a refetch returns %i, and keeps the session', async (status, title) => {
  let lost = false;
  server.use(
    http.get(`http://localhost/api/tickets/${ticketA.id}`, () => (lost ? new HttpResponse(null, { status }) : HttpResponse.json(ownTicket))),
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([])),
  );
  const queryClient = renderRequesterPage();
  expect(await screen.findByRole('heading', { name: ticketA.title })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Hủy vé/ })).toBeInTheDocument();

  lost = true;
  await act(() => queryClient.invalidateQueries({ queryKey: ['tickets'] }));
  expect(await screen.findByText(title)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: ticketA.title })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Hủy vé|Đính kèm tệp|Gửi bình luận/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Quay lại danh sách/ })).toHaveAttribute('href', '/requester-dashboard/tickets');
  expect(sessionStore.getSnapshot().token).toBe('requester');
});

it('hides cached timeline entries once access to the ticket is lost', async () => {
  let denied = false;
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => (
    denied ? new HttpResponse(null, { status: 403 }) : HttpResponse.json([timelineItemA])
  )));
  renderRequesterPage();
  expect(await screen.findByText(timelineItemA.content)).toBeInTheDocument();
  denied = true;
  await userEvent.type(screen.getByRole('textbox', { name: 'Nội dung bình luận' }), 'Cập nhật');
  server.use(http.post(`http://localhost/api/tickets/${ticketA.id}/comments`, () => HttpResponse.json(
    { ...timelineItemA, id: '20000000-0000-0000-0000-000000000002', content: 'Cập nhật' }, { status: 201 },
  )));
  await userEvent.click(screen.getByRole('button', { name: 'Gửi bình luận' }));
  await waitFor(() => expect(screen.queryByText(timelineItemA.content)).not.toBeInTheDocument());
});

it('takes no further reply or file from the requester once the ticket is closed', async () => {
  server.use(
    http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json({ ...ownTicket, status: TicketStatus.Closed })),
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([timelineItemA])),
  );
  renderRequesterPage();
  expect(await screen.findByText('Yêu cầu đã kết thúc nên không thể gửi thêm phản hồi.')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Nội dung bình luận' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Đính kèm tệp/ })).not.toBeInTheDocument();
  expect(await screen.findByText(timelineItemA.content)).toBeInTheDocument();
});

it('sends staff to the workspace for a ticket someone else asked for, never the requester screen', async () => {
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })),
    http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json(ticketA)),
  );
  renderRequesterPage();
  expect(await screen.findByText('workspace page')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Nội dung bình luận' })).not.toBeInTheDocument();
});

it('names the files the create screen could not attach, until the notice is closed', async () => {
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([])));
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[{ pathname: `/requester-dashboard/tickets/${ticketA.id}`, state: { failedUploads: ['hong.png', 'bao-cao.pdf'] } }]}>
      <Routes><Route path="/requester-dashboard/tickets/:id" element={<TicketDetailPage />} /></Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
  expect(await screen.findByText('Yêu cầu đã được gửi, nhưng chưa đính kèm được một số tệp')).toBeInTheDocument();
  expect(screen.getByText(/hong\.png, bao-cao\.pdf\. Hãy đính kèm lại/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Đóng thông báo' }));
  await waitFor(() => expect(screen.queryByText(/chưa đính kèm được một số tệp/)).not.toBeInTheDocument());
});
