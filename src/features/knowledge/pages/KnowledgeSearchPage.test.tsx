import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { articlePage, othersPublished, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { KnowledgeSearchPage } from './KnowledgeSearchPage';

const vpnGuide = {
  ...othersPublished, id: '40000000-0000-0000-0000-000000000011', title: 'Kết nối VPN từ xa', tags: ['vpn'],
  content: '## Các bước\n\n1. Mở **ứng dụng VPN**\n2. Đăng nhập bằng `email công ty`', publishedAt: '2026-11-04T08:00:00Z',
};
let requests: Record<string, string>[] = [];
let status = 200;
let items: object[] = [];
let total: number | undefined;

function Probe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search} ${JSON.stringify(location.state)}`}</div>;
}

function renderSearch(roles = ['Requester'], entry = '/knowledge') {
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/knowledge" element={<KnowledgeSearchPage helpPath="/tickets/new" />} />
        <Route path="*" element={<p>elsewhere</p>} />
      </Routes>
      <Probe />
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  requests = [];
  status = 200;
  items = [vpnGuide, othersPublished];
  total = undefined;
  sessionStore.setToken('requester');
  server.use(http.get('http://localhost/api/knowledge/articles/search', ({ request }) => {
    requests.push(Object.fromEntries(new URL(request.url).searchParams));
    if (status !== 200) return new HttpResponse(null, { status });
    return HttpResponse.json(articlePage(items, total));
  }));
});

it('lists Published articles newest first as cards with an excerpt, tags and date', async () => {
  renderSearch();
  const title = await screen.findByRole('link', { name: vpnGuide.title });
  // Published only, whoever asks: staff would otherwise also get their own drafts.
  expect(requests).toEqual([{ page: '1', pageSize: '10', status: '1' }]);
  expect(title).toHaveAttribute('href', `/knowledge/${vpnGuide.id}`);
  const card = within(title.closest('.ant-card') as HTMLElement);
  expect(card.getByText('Các bước Mở ứng dụng VPN Đăng nhập bằng email công ty')).toBeInTheDocument();
  expect(card.getByRole('link', { name: 'Lọc theo tag vpn' })).toHaveAttribute('href', '/knowledge?tag=vpn');
  expect(card.getByText(/Xuất bản 04\/11\/2026/)).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('2 bài viết');
});

it('asks staff for Published articles too', async () => {
  renderSearch(['Agent']);
  await screen.findByRole('link', { name: vpnGuide.title });
  expect(requests).toEqual([{ page: '1', pageSize: '10', status: '1' }]);
});

it('searches by keyword from page 1, keeps it in the URL and carries it to the article', async () => {
  renderSearch(['Requester'], '/knowledge?tag=vpn&page=2');
  await screen.findByRole('link', { name: vpnGuide.title });
  await userEvent.type(screen.getByRole('searchbox', { name: 'Tìm bài viết' }), '  mật khẩu {Enter}');
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', status: '1', tag: 'vpn', query: 'mật khẩu' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/knowledge?tag=vpn&q=m%E1%BA%ADt+kh%E1%BA%A9u');
  expect(await screen.findByRole('status')).toHaveTextContent('2 kết quả cho “mật khẩu” với tag “vpn”');

  await userEvent.click(screen.getByRole('link', { name: vpnGuide.title }));
  expect(screen.getByTestId('location')).toHaveTextContent(`/knowledge/${vpnGuide.id} {"resultsSearch":"?tag=vpn&q=m%E1%BA%ADt+kh%E1%BA%A9u"}`);
});

it('shows the tag in force and drops it on request', async () => {
  renderSearch(['Requester'], '/knowledge?tag=vpn&q=wifi');
  await screen.findByRole('link', { name: vpnGuide.title });
  await userEvent.click(screen.getByRole('button', { name: 'Bỏ lọc tag' }));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', status: '1', query: 'wifi' }));
});

it('pages through the results', async () => {
  total = 25;
  renderSearch();
  await screen.findByRole('link', { name: vpnGuide.title });
  await userEvent.click(screen.getByTitle('2'));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '2', pageSize: '10', status: '1' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/knowledge?page=2');
});

it('says nothing matched, and offers to clear the search or ask for help', async () => {
  items = [];
  renderSearch(['Requester'], '/knowledge?q=máy+fax&pageSize=20');
  expect(await screen.findByText(/Không tìm thấy bài viết nào phù hợp/)).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('0 kết quả cho “máy fax”');
  await userEvent.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '20', status: '1' }));
  expect(screen.getByRole('searchbox', { name: 'Tìm bài viết' })).toHaveValue('');
});

it('says when nothing is published yet, and sends the reader on to a request', async () => {
  items = [];
  renderSearch();
  expect(await screen.findByText('Kho tri thức chưa có bài viết nào được xuất bản.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/tickets/new');
});

it('says when a page past the end is empty, and goes back to the first', async () => {
  items = [];
  renderSearch(['Requester'], '/knowledge?q=vpn&page=4');
  expect(await screen.findByText('Trang 4 không còn bài viết nào.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Về trang đầu' }));
  await waitFor(() => expect(requests.at(-1)).toEqual({ page: '1', pageSize: '10', status: '1', query: 'vpn' }));
});

it('explains a failed search with a retry, and calls nothing empty', async () => {
  status = 500;
  renderSearch();
  expect(await screen.findByText('Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.')).toBeInTheDocument();
  expect(screen.queryByText(/chưa có bài viết nào/)).not.toBeInTheDocument();
  status = 200;
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByRole('link', { name: vpnGuide.title })).toBeInTheDocument();
});

it('shows article text as text, never as markup', async () => {
  items = [{ ...vpnGuide, content: 'Nhấn <img src=x onerror="window.__xss=1"> rồi Enter' }];
  renderSearch();
  const title = await screen.findByRole('link', { name: vpnGuide.title });
  const card = title.closest('.ant-card') as HTMLElement;
  expect(card.querySelector('img')).toBeNull();
  expect(card).toHaveTextContent('Nhấn rồi Enter');
});
