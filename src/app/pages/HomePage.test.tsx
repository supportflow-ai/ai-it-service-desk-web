import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../tests/render';
import { server } from '../../../tests/mocks/server';
import { articlePage, othersPublished, user } from '../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { HomePage } from './HomePage';

function renderHome(roles: string[]) {
  sessionStore.setToken('session');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })),
    http.get('http://localhost/api/tickets/me', () => HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0 })),
    http.get('http://localhost/api/knowledge/articles/search', () => HttpResponse.json(articlePage([othersPublished]))),
  );
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agent-workspace" element={<p>queue page</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

it.each([[['Agent']], [['Admin']], [['Requester', 'Agent']]])('sends %j accounts to the queue they work from', async (roles) => {
  renderHome(roles);
  expect(await screen.findByText('queue page')).toBeInTheDocument();
});

it('shows a requester the overview of their own tickets', async () => {
  renderHome(['Requester']);
  expect(await screen.findByText('Bạn chưa có yêu cầu nào.')).toBeInTheDocument();
  expect(screen.queryByText('queue page')).not.toBeInTheDocument();
  // The knowledge card loads on its own, after the overview.
  expect(await screen.findByRole('link', { name: othersPublished.title }, { timeout: 5000 })).toHaveAttribute('href', `/knowledge/${othersPublished.id}`);
});
