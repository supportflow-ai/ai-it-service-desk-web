import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { othersPublished, ownDraft, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { PublishedArticlePage } from './PublishedArticlePage';

const articleUrl = (id: string) => `http://localhost/api/knowledge/articles/${id}`;
const guide = {
  ...othersPublished,
  content: '## Các bước\n\n1. Mở **Cài đặt**\n2. Chọn [trang đổi mật khẩu](https://example.com/pw)',
  publishedAt: '2026-11-03T08:00:00Z', updatedAt: '2026-11-03T08:00:00Z',
};
let served: object = guide;
let asked = 0;

function Probe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderReader(roles = ['Requester'], id = guide.id, state: unknown = null) {
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper, queryClient } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[{ pathname: `/knowledge/${id}`, state }]}>
      <Routes>
        <Route path="/knowledge/:id" element={<PublishedArticlePage helpPath="/tickets/new" />} />
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
  return queryClient;
}

beforeEach(() => {
  served = guide;
  asked = 0;
  sessionStore.setToken('requester');
  server.use(http.get(articleUrl(':id'), () => { asked += 1; return HttpResponse.json(served); }));
});

it('renders a Published article with its title, tags, version and the way on', async () => {
  renderReader();
  expect(await screen.findByRole('heading', { level: 2, name: guide.title })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Các bước' })).toBeInTheDocument();
  expect(screen.getByText('Cài đặt', { selector: 'strong' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Bài viết cùng tag mail' })).toHaveAttribute('href', '/knowledge?tag=mail');
  expect(screen.getByText(/^Phiên bản 1 · Xuất bản \d\d:\d\d 03\/11\/2026$/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Về Kho tri thức/ })).toHaveAttribute('href', '/knowledge');
  // The reader is not where articles are managed, and says nothing about who wrote them.
  expect(screen.queryByRole('link', { name: /trang quản lý/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/Tác giả/)).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/tickets/new');
});

it('goes back to the search results it was opened from', async () => {
  renderReader(['Requester'], guide.id, { resultsSearch: '?q=m%E1%BA%ADt+kh%E1%BA%A9u&page=2' });
  const back = await screen.findByRole('link', { name: /Quay lại kết quả tìm kiếm/ });
  expect(back).toHaveAttribute('href', '/knowledge?q=m%E1%BA%ADt+kh%E1%BA%A9u&page=2');
});

it('says when the article was updated after it was published', async () => {
  served = { ...guide, updatedAt: '2026-11-04T10:00:00Z' };
  renderReader();
  expect(await screen.findByText(/· Cập nhật \d\d:\d\d 04\/11\/2026$/)).toBeInTheDocument();
});

it('shows a draft or archived article to a Requester as not found, like a missing one (UX-04)', async () => {
  server.use(http.get(articleUrl(ownDraft.id), () => HttpResponse.json({ error: 'Không tìm thấy bài viết.' }, { status: 404 })));
  renderReader(['Requester'], ownDraft.id, { resultsSearch: '?q=vpn' });
  expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Quay lại kết quả tìm kiếm/ })).toHaveAttribute('href', '/knowledge?q=vpn');
});

it('does not show a Requester an unpublished article even if one is served', async () => {
  served = { ...ownDraft, authorId: '00000000-0000-0000-0000-000000000009' };
  renderReader(['Requester'], ownDraft.id);
  expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
  expect(screen.queryByText(ownDraft.title)).not.toBeInTheDocument();
});

it("sends staff to where their unpublished article is managed", async () => {
  served = ownDraft;
  renderReader(['Agent'], ownDraft.id);
  expect(await screen.findByTestId('location')).toHaveTextContent(`/knowledge/manage/${ownDraft.id}`);
});

it('offers staff the management page of a Published article', async () => {
  renderReader(['Agent']);
  expect(await screen.findByRole('link', { name: 'Mở bài viết trong trang quản lý' })).toHaveAttribute('href', `/knowledge/manage/${guide.id}`);
});

it('shows not found for an address that names no article, without asking the backend', async () => {
  renderReader(['Requester'], 'not-an-id');
  expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
  expect(asked).toBe(0);
});

it('renders stored HTML as text and drops script links (NFR-SEC-04)', async () => {
  served = { ...guide, content: 'Bấm [đây](javascript:alert(1)) rồi <script>window.__xss = 1</script>' };
  renderReader();
  const body = await screen.findByText(/Bấm/);
  expect(document.querySelector('script')).toBeNull();
  expect(screen.getByText('đây').closest('a')).not.toHaveAttribute('href');
  expect(body.closest('.kb-markdown')).toHaveTextContent('<script>window.__xss = 1</script>');
});

it('keeps the article on screen when a refresh fails, with a retry', async () => {
  const queryClient = renderReader();
  await screen.findByRole('heading', { level: 2, name: guide.title });
  server.use(http.get(articleUrl(':id'), () => new HttpResponse(null, { status: 500 })));
  await act(async () => { await queryClient.refetchQueries(); });
  expect(await screen.findByText('Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: guide.title })).toBeInTheDocument();
});

describe('opened from a semantic result (TC-362)', () => {
  const sourced = { ...guide, content: '## Trước khi bắt đầu\n\nCần tài khoản công ty.\n\n## Các   **bước**\n\n1. Mở Cài đặt' };
  const scrolled: string[] = [];
  beforeEach(() => {
    served = sourced;
    scrolled.length = 0;
    // jsdom does not lay out pages, so it has no scrollIntoView of its own.
    Element.prototype.scrollIntoView = vi.fn(function record(this: Element) { scrolled.push((this.textContent ?? '').replace(/\s+/g, ' ')); });
  });

  it('scrolls to the section of the passage, marks it and says where the match is', async () => {
    renderReader(['Requester'], guide.id, { resultsSearch: '?mode=semantic&q=l%C3%A0m+sao', section: 'Các bước' });
    expect(await screen.findByText('Đoạn khớp với câu hỏi nằm ở mục “Các bước”.')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 2, name: 'Các bước' });
    expect(scrolled).toEqual(['Các bước']);
    expect(heading).toHaveClass('kb-source-section');
    expect(heading).toHaveFocus();
    expect(screen.getByRole('link', { name: /Quay lại kết quả tìm kiếm/ })).toHaveAttribute('href', '/knowledge?mode=semantic&q=l%C3%A0m+sao');

    await userEvent.click(screen.getByRole('button', { name: 'Tới mục này' }));
    expect(scrolled).toEqual(['Các bước', 'Các bước']);
  });

  it('says when the section is no longer in the article, and scrolls nowhere', async () => {
    renderReader(['Requester'], guide.id, { resultsSearch: '?q=x', section: 'Lỗi 809' });
    expect(await screen.findByText('Mục “Lỗi 809” không còn trong phiên bản hiện tại của bài; bên dưới là toàn bộ bài viết.')).toBeInTheDocument();
    expect(scrolled).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Tới mục này' })).not.toBeInTheDocument();
  });

  it('says when the passage is in the opening of the article', async () => {
    renderReader(['Requester'], guide.id, { resultsSearch: '?q=x', section: null });
    expect(await screen.findByText('Đoạn khớp với câu hỏi nằm ở phần mở đầu bài viết.')).toBeInTheDocument();
    expect(scrolled).toEqual([]);
  });

  it('says nothing about sections when not opened from a semantic result', async () => {
    renderReader(['Requester'], guide.id, { resultsSearch: '?q=x' });
    await screen.findByRole('heading', { level: 2, name: guide.title });
    expect(screen.queryByText(/Đoạn khớp với câu hỏi/)).not.toBeInTheDocument();
    expect(scrolled).toEqual([]);
  });
});
