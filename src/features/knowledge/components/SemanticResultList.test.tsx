import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import type { SemanticMatch } from '../model/knowledge.types';
import { SemanticResultList } from './SemanticResultList';

const vpn = { articleId: '40000000-0000-0000-0000-000000000031', title: 'Kết nối VPN khi làm việc từ xa', tags: ['vpn'], version: 1, publishedAt: '2026-11-04T08:00:00Z' };
const mail = { articleId: '40000000-0000-0000-0000-000000000032', title: 'Đổi mật khẩu email', tags: ['mail'], version: 2, publishedAt: '2026-11-03T08:00:00Z' };
const matches: SemanticMatch[] = [
  { ...mail, section: null, snippet: 'Vào **Cài đặt** để đổi mật khẩu.', score: 0.41 },
  { ...vpn, section: 'Các bước', snippet: '1. Mở ứng dụng **VPN**\n2. Chọn máy chủ `vpn.supportflow.local`', score: 0.8234 },
  { ...vpn, section: 'Lỗi thường gặp', snippet: 'Lỗi 809: kiểm tra tường lửa.', score: 0.6 },
];

function Opened() {
  const location = useLocation();
  return <div data-testid="opened">{`${location.pathname} ${JSON.stringify(location.state)}`}</div>;
}

function renderList(list: readonly SemanticMatch[], handlers: { onKeywordSearch?: () => void; onAskForHelp?: () => void } = {}) {
  const onAskForHelp = handlers.onAskForHelp ?? vi.fn();
  render(
    <MemoryRouter initialEntries={['/knowledge']}>
      <Routes>
        <Route path="/knowledge" element={(
          <SemanticResultList matches={list} resultsState={{ resultsSearch: '?q=vpn' }} onKeywordSearch={handlers.onKeywordSearch} onAskForHelp={onAskForHelp} />
        )} />
        <Route path="/knowledge/:id" element={<Opened />} />
      </Routes>
    </MemoryRouter>,
  );
}

function card(title: string) {
  return within(screen.getByRole('heading', { name: title }).closest('.ant-card') as HTMLElement);
}

it('shows one card per source article, the closest first, with section, plain snippet and source', () => {
  renderList(matches);
  const results = screen.getByRole('region', { name: 'Kết quả tìm theo nghĩa' });
  expect(within(results).getByText('2 bài viết có nội dung gần với câu hỏi, xếp theo độ liên quan.')).toBeInTheDocument();
  expect(within(results).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([vpn.title, mail.title]);

  expect(card(vpn.title).getByText('Mục: Các bước')).toBeInTheDocument();
  expect(card(vpn.title).getByText('Mở ứng dụng VPN Chọn máy chủ vpn.supportflow.local')).toBeInTheDocument();
  expect(card(vpn.title).getByText('Nguồn: Kết nối VPN khi làm việc từ xa · Phiên bản 1 · Xuất bản 04/11/2026')).toBeInTheDocument();
  expect(card(vpn.title).getByText('vpn')).toBeInTheDocument();
  expect(within(card(vpn.title).getByRole('list', { name: `Đoạn khác khớp trong bài ${vpn.title}` })).getByText('Lỗi thường gặp')).toBeInTheDocument();

  expect(card(mail.title).getByText('Mục: Phần mở đầu')).toBeInTheDocument();
  expect(card(mail.title).queryByRole('list')).not.toBeInTheDocument();
});

it('shows relevance as a band, with the model score explained only in the tooltip and never as a percentage', async () => {
  renderList(matches);
  expect(screen.getByText('Độ liên quan: Cao')).toBeInTheDocument();
  expect(screen.getByText('Độ liên quan: Trung bình')).toBeInTheDocument();
  expect(screen.getByText('Độ liên quan: Thấp')).toBeInTheDocument();
  await userEvent.hover(screen.getByText('Độ liên quan: Cao'));
  expect(await screen.findByText('Điểm mô hình 0.82: dùng để xếp hạng kết quả, không phải xác suất đúng.')).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/\d\s*%/);
});

it('shows a passage as text, never as markup', () => {
  renderList([{ ...vpn, section: 'Bước 1', snippet: 'Bấm <img src=x onerror="window.__xss=1"> rồi [đây](javascript:alert(1))', score: 0.9 }]);
  expect(document.querySelector('img')).toBeNull();
  expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([`/knowledge/${vpn.articleId}`]);
  expect(screen.getByText('Bấm rồi đây')).toBeInTheDocument();
});

it('opens the source article at the section of the passage, keeping the results to come back to', async () => {
  renderList(matches);
  await userEvent.click(screen.getByRole('link', { name: vpn.title }));
  expect(screen.getByTestId('opened')).toHaveTextContent(`/knowledge/${vpn.articleId} {"resultsSearch":"?q=vpn","section":"Các bước"}`);
});

it('opens another matching passage at its own section', async () => {
  renderList(matches);
  await userEvent.click(screen.getByRole('link', { name: `Mở bài ${vpn.title} tại mục Lỗi thường gặp` }));
  expect(screen.getByTestId('opened')).toHaveTextContent(`/knowledge/${vpn.articleId} {"resultsSearch":"?q=vpn","section":"Lỗi thường gặp"}`);
});

it('leaves out passages below the relevance threshold', () => {
  renderList([...matches, { ...mail, articleId: '40000000-0000-0000-0000-000000000033', title: 'Cài máy in', section: null, snippet: 'Máy in tầng 3', score: 0.2 }]);
  expect(screen.queryByText('Cài máy in')).not.toBeInTheDocument();
  expect(screen.getByText('2 bài viết có nội dung gần với câu hỏi, xếp theo độ liên quan.')).toBeInTheDocument();
});

it('has its own empty state when passages came back but none is close enough', async () => {
  const onKeywordSearch = vi.fn();
  const onAskForHelp = vi.fn();
  renderList([{ ...mail, section: null, snippet: 'Máy in tầng 3', score: 0.2 }], { onKeywordSearch, onAskForHelp });
  expect(screen.getByText('Chưa có bài viết nào đủ liên quan tới câu hỏi của bạn.')).toBeInTheDocument();
  expect(screen.queryByText(mail.title)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tìm theo từ khóa' }));
  await userEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }));
  expect(onKeywordSearch).toHaveBeenCalledOnce();
  expect(onAskForHelp).toHaveBeenCalledOnce();
});

it('says so when nothing came back, and offers no keyword search the page does not have', () => {
  renderList([]);
  expect(screen.getByText('Không tìm thấy nội dung nào gần với câu hỏi của bạn.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Tìm theo từ khóa' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' })).toBeInTheDocument();
});
