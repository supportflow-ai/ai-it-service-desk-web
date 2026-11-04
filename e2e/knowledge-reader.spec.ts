import { test, expect } from './fixtures';
import { othersPublished, ownDraft } from '../tests/fixtures';

const vpnGuide = {
  ...othersPublished, id: '40000000-0000-0000-0000-000000000021', title: 'Kết nối VPN khi làm việc từ xa', tags: ['vpn', 'mạng'],
  content: '## Các bước\n\n1. Mở ứng dụng **VPN**\n2. Đăng nhập bằng email công ty', publishedAt: '2026-11-04T08:00:00Z',
};
const mailGuide = { ...othersPublished, content: 'Vào **Cài đặt** để đổi mật khẩu email.' };
const hiddenDraft = { ...ownDraft, id: '40000000-0000-0000-0000-000000000022', title: 'Nháp VPN chưa xuất bản', tags: ['vpn'] };
const archived = { ...othersPublished, id: '40000000-0000-0000-0000-000000000023', title: 'VPN cũ đã lưu trữ', status: 2, tags: ['vpn'] };

test('a Requester finds Published articles from the menu by keyword and by tag', async ({ page, api }) => {
  api.articles = [vpnGuide, mailGuide, hiddenDraft, archived];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/requester-dashboard/tickets');
  await page.getByRole('menuitem', { name: /Kho tri thức/ }).click();
  await expect(page).toHaveURL('/knowledge');
  await expect(page.getByRole('link', { name: vpnGuide.title })).toBeVisible();
  await expect(page.getByRole('link', { name: mailGuide.title })).toBeVisible();
  await expect(page.getByText(hiddenDraft.title)).toHaveCount(0);
  await expect(page.getByText(archived.title)).toHaveCount(0);

  await page.getByRole('searchbox', { name: 'Tìm bài viết' }).fill('vpn');
  await page.getByRole('searchbox', { name: 'Tìm bài viết' }).press('Enter');
  await expect(page).toHaveURL('/knowledge?q=vpn');
  await expect(page.getByRole('status')).toHaveText('1 kết quả cho “vpn”');
  await expect(page.getByRole('link', { name: mailGuide.title })).toHaveCount(0);
  await expect(page.getByRole('link', { name: vpnGuide.title })).toHaveAttribute('href', `/knowledge/${vpnGuide.id}`);

  await page.getByRole('link', { name: 'Lọc theo tag mạng' }).click();
  await expect(page).toHaveURL('/knowledge?tag=m%E1%BA%A1ng');
  await expect(page.getByRole('status')).toHaveText('1 kết quả với tag “mạng”');

  await page.getByRole('searchbox', { name: 'Tìm bài viết' }).fill('máy fax');
  await page.getByRole('searchbox', { name: 'Tìm bài viết' }).press('Enter');
  await expect(page.getByText(/Không tìm thấy bài viết nào phù hợp/)).toBeVisible();
  await page.getByRole('button', { name: 'Tạo yêu cầu hỗ trợ' }).click();
  await expect(page).toHaveURL('/tickets/new');
  expect(api.requests.filter((request) => request.startsWith('GET /api/knowledge/articles/search')).every((request) => request.includes('status=1'))).toBe(true);
});

test("the overview's knowledge card shows the newest articles and opens a search", async ({ page, api }) => {
  api.articles = [mailGuide, vpnGuide, hiddenDraft];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/');
  const card = page.getByRole('list', { name: 'Bài viết mới' });
  await expect(card.getByRole('link')).toHaveText([vpnGuide.title, mailGuide.title]);
  await page.getByRole('searchbox', { name: 'Tìm bài viết hướng dẫn' }).fill('mật khẩu');
  await page.getByRole('searchbox', { name: 'Tìm bài viết hướng dẫn' }).press('Enter');
  await expect(page).toHaveURL('/knowledge?q=m%E1%BA%ADt+kh%E1%BA%A9u');
  await expect(page.getByRole('link', { name: mailGuide.title })).toBeVisible();
});
