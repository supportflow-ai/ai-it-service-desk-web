import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, timelineItemA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketDetailPage } from './TicketDetailPage';

const leakedNote = { ...timelineItemA, id: '20000000-0000-0000-0000-000000000009', content: 'Ghi chú bí mật', isInternal: true };

function renderRequesterPage() {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[`/requester-dashboard/tickets/${ticketA.id}`]}>
      <Routes><Route path="/requester-dashboard/tickets/:id" element={<TicketDetailPage />} /></Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  sessionStore.setToken('requester');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)),
    http.get(`http://localhost/api/tickets/${ticketA.id}`, () => HttpResponse.json(ticketA)),
  );
});

it('lets the requester read the public timeline, but never internal notes or the internal composer', async () => {
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, () => HttpResponse.json([timelineItemA, leakedNote])));
  renderRequesterPage();
  expect(await screen.findByText(timelineItemA.content)).toBeInTheDocument();
  expect(screen.queryByText(leakedNote.content)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Ghi chú nội bộ' })).not.toBeInTheDocument();
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
