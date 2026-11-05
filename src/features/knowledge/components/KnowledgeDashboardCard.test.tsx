import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { articlePage, othersPublished, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { KnowledgeDashboardCard } from './KnowledgeDashboardCard';

let requests: Record<string, string>[] = [];
let status = 200;
let items: object[] = [];

function Probe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderCard() {
  const { Wrapper } = createTestWrapper();
  render(<MemoryRouter><KnowledgeDashboardCard /><Probe /></MemoryRouter>, { wrapper: Wrapper });
}

beforeEach(() => {
  requests = [];
  status = 200;
  items = [othersPublished];
  sessionStore.setToken('requester');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Requester'] })),
    http.get('http://localhost/api/knowledge/articles/search', ({ request }) => {
      requests.push(Object.fromEntries(new URL(request.url).searchParams));
      return status === 200 ? HttpResponse.json(articlePage(items)) : new HttpResponse(null, { status });
    }),
  );
});

it('shows the three newest Published articles, linked to the reader', async () => {
  renderCard();
  expect(await screen.findByRole('link', { name: othersPublished.title })).toHaveAttribute('href', `/knowledge/${othersPublished.id}`);
  expect(requests).toEqual([{ page: '1', pageSize: '3', status: '1' }]);
  expect(screen.getByRole('link', { name: 'Xem tất cả bài viết' })).toHaveAttribute('href', '/knowledge');
});

it('opens the knowledge search with the keyword typed', async () => {
  renderCard();
  await userEvent.type(screen.getByRole('searchbox', { name: 'Tìm bài viết hướng dẫn' }), ' VPN {Enter}');
  expect(screen.getByTestId('location')).toHaveTextContent('/knowledge?q=VPN');
});

it('says when nothing is published yet', async () => {
  items = [];
  renderCard();
  expect(await screen.findByText('Chưa có bài viết nào được xuất bản.')).toBeInTheDocument();
});

it('says when the articles could not be loaded, and retries', async () => {
  status = 500;
  renderCard();
  expect(await screen.findByText(/Chưa tải được bài viết/)).toBeInTheDocument();
  status = 200;
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  await waitFor(() => expect(screen.getByRole('link', { name: othersPublished.title })).toBeInTheDocument());
});
