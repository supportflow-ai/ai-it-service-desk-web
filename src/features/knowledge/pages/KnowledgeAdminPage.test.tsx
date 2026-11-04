import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { articlePage, othersDraft, othersPublished, ownDraft, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { KnowledgeAdminPage } from './KnowledgeAdminPage';

let requests: Record<string, string>[] = [];
let listStatus = 200;
let items: object[] = [];

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderList(roles: string[], entry = '/knowledge/manage') {
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes><Route path="/knowledge/manage" element={<KnowledgeAdminPage />} /></Routes>
      <LocationProbe />
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

function row(title: string) {
  const cell = screen.getByText(title).closest('tr');
  if (!cell) throw new Error(`No row for ${title}`);
  return within(cell);
}

beforeEach(() => {
  requests = [];
  listStatus = 200;
  items = [ownDraft, othersPublished, othersDraft];
  sessionStore.setToken('agent');
  server.use(http.get('http://localhost/api/knowledge/articles', ({ request }) => {
    requests.push(Object.fromEntries(new URL(request.url).searchParams));
    if (listStatus !== 200) return new HttpResponse(null, { status: listStatus });
    return HttpResponse.json(articlePage(items, 23));
  }));
});

it('lists every status from the backend with status, tags, version and author', async () => {
  renderList(['Agent']);
  expect(await screen.findByText(ownDraft.title)).toBeInTheDocument();
  expect(requests).toEqual([{ page: '1', pageSize: '10' }]);
  expect(screen.getByRole('tab', { name: 'Tất cả (23)' })).toHaveAttribute('aria-selected', 'true');
  expect(row(ownDraft.title).getByText('Nháp')).toBeInTheDocument();
  expect(row(ownDraft.title).getByText('vpn')).toBeInTheDocument();
  expect(row(ownDraft.title).getByText('v1')).toBeInTheDocument();
  expect(row(ownDraft.title).getByText('Bạn')).toBeInTheDocument();
  expect(row(othersPublished.title).getByText('Đã xuất bản')).toBeInTheDocument();
  expect(row(othersPublished.title).getByText('Người khác')).toBeInTheDocument();
  expect(screen.getByText('1–10 trên 23 bài viết')).toBeInTheDocument();
});

it("locks another author's unpublished article for an Agent, which would only open on 404", async () => {
  renderList(['Agent']);
  await screen.findByText(othersDraft.title);
  expect(row(othersDraft.title).getByText(/Bài chưa xuất bản của kỹ thuật viên khác/)).toBeInTheDocument();
  expect(row(othersPublished.title).queryByText(/chưa xuất bản của kỹ thuật viên khác/)).not.toBeInTheDocument();
  expect(row(ownDraft.title).queryByText(/chưa xuất bản của kỹ thuật viên khác/)).not.toBeInTheDocument();
});

it('locks nothing for an Admin, who reads every article', async () => {
  renderList(['Admin']);
  await screen.findByText(othersDraft.title);
  expect(screen.queryByText(/chưa xuất bản của kỹ thuật viên khác/)).not.toBeInTheDocument();
});

it('filters by status, keyword and tag from page 1 and keeps them in the URL', async () => {
  renderList(['Agent'], '/knowledge/manage?page=2');
  await screen.findByText(ownDraft.title);
  expect(requests[0]).toEqual({ page: '2', pageSize: '10' });

  await userEvent.click(screen.getByRole('tab', { name: /Nháp/ }));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', status: '0' }));

  await userEvent.type(screen.getByRole('searchbox', { name: 'Tìm bài viết' }), 'mật khẩu{Enter}');
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', status: '0', query: 'mật khẩu' }));

  await userEvent.type(screen.getByRole('searchbox', { name: 'Lọc theo tag' }), 'vpn{Enter}');
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', status: '0', query: 'mật khẩu', tag: 'vpn' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/knowledge/manage?status=draft&tag=vpn&q=m%E1%BA%ADt+kh%E1%BA%A9u');
});

it('restores the filters from the URL', async () => {
  renderList(['Agent'], '/knowledge/manage?status=published&tag=mail');
  await screen.findByText(ownDraft.title);
  expect(requests[0]).toEqual({ page: '1', pageSize: '10', status: '1', tag: 'mail' });
  expect(screen.getByRole('tab', { name: /Đã xuất bản/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('searchbox', { name: 'Lọc theo tag' })).toHaveValue('mail');
});

it('says so when nothing matches', async () => {
  items = [];
  renderList(['Agent']);
  expect(await screen.findByText('Không có bài viết nào phù hợp với bộ lọc.')).toBeInTheDocument();
});

it('shows a permission error without any rows', async () => {
  listStatus = 403;
  renderList(['Agent']);
  expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này.')).toBeInTheDocument();
  expect(screen.queryByText(ownDraft.title)).not.toBeInTheDocument();
});
