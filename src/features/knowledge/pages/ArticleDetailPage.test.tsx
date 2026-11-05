import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { othersDraft, othersPublished, ownDraft, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { ArticleDetailPage } from './ArticleDetailPage';

const articleUrl = (id: string) => `http://localhost/api/knowledge/articles/${id}`;
let served: object = ownDraft;

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search} ${JSON.stringify(location.state)}`}</output>;
}

function renderRead(roles = ['Agent'], id = ownDraft.id, state: unknown = null) {
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper, queryClient } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[{ pathname: `/knowledge/manage/${id}`, state }]}>
      <Routes>
        <Route path="/knowledge/manage/:id" element={<ArticleDetailPage />} />
        <Route path="/knowledge/manage/:id/edit" element={<LocationProbe />} />
        <Route path="/knowledge/manage" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
  return queryClient;
}

beforeEach(() => {
  served = ownDraft;
  sessionStore.setToken('agent');
  server.use(http.get(articleUrl(':id'), () => HttpResponse.json(served)));
});

it('shows the article as readers will, with its status, tags, author and dates', async () => {
  renderRead();
  expect(await screen.findByRole('heading', { level: 2, name: ownDraft.title })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Bước 1' })).toBeInTheDocument();
  expect(screen.getByText(/Mở ứng dụng VPN/)).toBeInTheDocument();
  expect(screen.getByText('Nháp')).toBeInTheDocument();
  expect(screen.getByText('vpn')).toBeInTheDocument();
  expect(screen.getByText(/Tác giả: Bạn · Tạo lúc/)).toBeInTheDocument();
  expect(screen.getByText(/người dùng chưa đọc được bài này/)).toBeInTheDocument();
});

it('offers the author edit and publish, and opens the editor with the list it came from', async () => {
  renderRead(['Agent'], ownDraft.id, { listSearch: '?status=draft' });
  await screen.findByRole('heading', { level: 2, name: ownDraft.title });
  expect(screen.getByRole('button', { name: /Xuất bản/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Quay lại danh sách/ })).toHaveAttribute('href', '/knowledge/manage?status=draft');

  await userEvent.click(screen.getByRole('button', { name: /Sửa/ }));
  expect(await screen.findByTestId('location')).toHaveTextContent(`/knowledge/manage/${ownDraft.id}/edit {"listSearch":"?status=draft"}`);
});

it("offers nothing to change on another author's published article to an Agent", async () => {
  served = othersPublished;
  renderRead(['Agent'], othersPublished.id);
  await screen.findByRole('heading', { level: 2, name: othersPublished.title });
  expect(screen.getByText(/Tác giả: Người khác/)).toBeInTheDocument();
  expect(screen.getByText(/Xuất bản \d\d:\d\d 03\/11\/2026/)).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('lets an Admin archive a published article, then shows it archived', async () => {
  served = othersPublished;
  const archived = { ...othersPublished, status: 2, revision: 50, archivedAt: '2026-11-04T12:00:00Z' };
  const sent: unknown[] = [];
  server.use(http.post(`${articleUrl(':id')}/archive`, async ({ request }) => {
    sent.push(await request.json());
    served = archived;
    return HttpResponse.json(archived);
  }));
  renderRead(['Admin'], othersPublished.id);
  await screen.findByRole('heading', { level: 2, name: othersPublished.title });
  expect(screen.queryByRole('button', { name: /Sửa/ })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Lưu trữ/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận lưu trữ' }));
  await waitFor(() => expect(sent).toEqual([{ expectedRevision: othersPublished.revision }]));
  expect(await screen.findByText(/người dùng không còn thấy bài này/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Lưu trữ/ })).not.toBeInTheDocument();
  expect(screen.getByText('Lưu trữ')).toBeInTheDocument();
  expect(screen.getByText(/· Lưu trữ \d\d:\d\d 04\/11\/2026/)).toBeInTheDocument();
});

it("shows not found for another author's draft to an Agent, the same as for a missing one", async () => {
  server.use(http.get(articleUrl(othersDraft.id), () => HttpResponse.json({ error: 'Không tìm thấy bài viết.' }, { status: 404 })));
  renderRead(['Agent'], othersDraft.id, { listSearch: '?tag=vpn' });
  expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Quay lại danh sách/ })).toHaveAttribute('href', '/knowledge/manage?tag=vpn');
});

it('shows not found for an address that names no article, without asking the backend', async () => {
  let asked = false;
  server.use(http.get(articleUrl(':id'), () => { asked = true; return HttpResponse.json(served); }));
  renderRead(['Agent'], 'not-an-id');
  expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
  expect(asked).toBe(false);
});

it('keeps the article on screen when a refresh fails, with a way to try again', async () => {
  const queryClient = renderRead();
  await screen.findByRole('heading', { level: 2, name: ownDraft.title });
  server.use(http.get(articleUrl(':id'), () => new HttpResponse(null, { status: 500 })));
  await act(async () => { await queryClient.refetchQueries(); });
  expect(await screen.findByText('Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: ownDraft.title })).toBeInTheDocument();
});
