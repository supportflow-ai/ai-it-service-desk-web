import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import type { SemanticMatch } from '../model/knowledge.types';
import { SemanticResultList } from './SemanticResultList';

const vpn = { articleId: '40000000-0000-0000-0000-000000000031', title: 'Kết nối VPN khi làm việc từ xa', tags: ['vpn'], version: 1, publishedAt: '2026-11-04T08:00:00Z' };
const mail = { articleId: '40000000-0000-0000-0000-000000000032', title: 'Đổi mật khẩu email', tags: ['mail'], version: 2, publishedAt: '2026-11-03T08:00:00Z' };
const matches: SemanticMatch[] = [
  { ...mail, section: null, snippet: 'Vào **Cài đặt** để đổi mật khẩu.', score: 0.41 },
  { ...vpn, section: 'Các bước', snippet: '1. Mở ứng dụng **VPN**\n2. Chọn máy chủ `vpn.supportflow.local`', score: 0.8234 },
  { ...vpn, section: 'Lỗi thường gặp', snippet: 'Lỗi 809: kiểm tra tường lửa.', score: 0.6 },
];

it('shows one card per source article, the closest first, with section, plain snippet and source', () => {
  render(<SemanticResultList matches={matches} />);
  const results = screen.getByRole('region', { name: 'Kết quả tìm theo nghĩa' });
  expect(within(results).getByText('2 bài viết có nội dung gần với câu hỏi, xếp theo độ liên quan.')).toBeInTheDocument();
  expect(within(results).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([vpn.title, mail.title]);

  const vpnCard = within(screen.getByRole('heading', { name: vpn.title }).closest('.ant-card') as HTMLElement);
  expect(vpnCard.getByText('Mục: Các bước')).toBeInTheDocument();
  expect(vpnCard.getByText('Mở ứng dụng VPN Chọn máy chủ vpn.supportflow.local')).toBeInTheDocument();
  expect(vpnCard.getByText('Nguồn: Kết nối VPN khi làm việc từ xa · Phiên bản 1 · Xuất bản 04/11/2026')).toBeInTheDocument();
  expect(vpnCard.getByText('vpn')).toBeInTheDocument();
  expect(within(vpnCard.getByRole('list', { name: `Đoạn khác khớp trong bài ${vpn.title}` })).getByText(/Lỗi thường gặp/)).toBeInTheDocument();

  const mailCard = within(screen.getByRole('heading', { name: mail.title }).closest('.ant-card') as HTMLElement);
  expect(mailCard.getByText('Mục: Phần mở đầu')).toBeInTheDocument();
  expect(mailCard.queryByRole('list')).not.toBeInTheDocument();
});

it('shows relevance as a band, with the model score explained only in the tooltip and never as a percentage', async () => {
  render(<SemanticResultList matches={matches} />);
  expect(screen.getByText('Độ liên quan: Cao')).toBeInTheDocument();
  expect(screen.getByText('Độ liên quan: Trung bình')).toBeInTheDocument();
  expect(screen.getByText('Độ liên quan: Thấp')).toBeInTheDocument();
  await userEvent.hover(screen.getByText('Độ liên quan: Cao'));
  expect(await screen.findByText('Điểm mô hình 0.82: dùng để xếp hạng kết quả, không phải xác suất đúng.')).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/\d\s*%/);
});

it('shows a passage as text, never as markup', () => {
  render(<SemanticResultList matches={[{ ...vpn, section: 'Bước 1', snippet: 'Bấm <img src=x onerror="window.__xss=1"> rồi [đây](javascript:alert(1))', score: 0.9 }]} />);
  expect(document.querySelector('img')).toBeNull();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText('Bấm rồi đây')).toBeInTheDocument();
});
