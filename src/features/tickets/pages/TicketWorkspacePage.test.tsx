import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user, timelineItemA } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketWorkspacePage } from './TicketWorkspacePage';

it('renders workspace with real ticket data and dynamic timeline', async () => {
  sessionStore.setToken('agent');
  const requests: string[] = [];
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })),
    http.get(`http://localhost/api/tickets/${ticketA.id}`, ({ request }) => {
      requests.push(new URL(request.url).pathname);
      return HttpResponse.json(ticketA);
    }),
    http.get(`http://localhost/api/tickets/${ticketA.id}/timeline`, ({ request }) => {
      requests.push(new URL(request.url).pathname);
      return HttpResponse.json([timelineItemA]);
    }),
  );
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[`/agent-workspace/tickets/${ticketA.id}`]}>
      <Routes><Route path="/agent-workspace/tickets/:id" element={<TicketWorkspacePage />} /></Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
  expect(await screen.findByRole('heading', { name: ticketA.title })).toBeInTheDocument();
  expect(await screen.findByText(timelineItemA.content)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Nhận xử lý/i })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Gửi bình luận/i })).toBeDisabled();
  expect(requests).toEqual([`/api/tickets/${ticketA.id}`, `/api/tickets/${ticketA.id}/timeline`]);
});
