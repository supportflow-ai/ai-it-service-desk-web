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

test('TC-219 demo: a Requester searches a keyword, opens the Published article and goes back to the results', async ({ page, api }) => {
  api.articles = [vpnGuide, mailGuide, hiddenDraft];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/knowledge');
  await page.getByRole('searchbox', { name: 'Tìm bài viết' }).fill('vpn');
  await page.getByRole('searchbox', { name: 'Tìm bài viết' }).press('Enter');
  await page.getByRole('link', { name: vpnGuide.title }).click();

  await expect(page).toHaveURL(`/knowledge/${vpnGuide.id}`);
  await expect(page.getByRole('heading', { level: 2, name: vpnGuide.title })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Các bước' })).toBeVisible();
  await expect(page.getByText('VPN', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Phiên bản 1 · Xuất bản/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bài viết cùng tag vpn' })).toHaveAttribute('href', '/knowledge?tag=vpn');

  await page.getByRole('link', { name: /Quay lại kết quả tìm kiếm/ }).click();
  await expect(page).toHaveURL('/knowledge?q=vpn');
  await expect(page.getByRole('searchbox', { name: 'Tìm bài viết' })).toHaveValue('vpn');
  expect(api.requests).toContain(`GET /api/knowledge/articles/${vpnGuide.id}`);
});

test('a Requester opening an unpublished article by its address gets not found (UX-04)', async ({ page, api }) => {
  api.articles = [vpnGuide, hiddenDraft, archived];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  for (const hidden of [hiddenDraft, archived]) {
    await page.goto(`/knowledge/${hidden.id}`);
    await expect(page.getByText('Không tìm thấy bài viết', { exact: true })).toBeVisible();
    await expect(page.getByText(hidden.title)).toHaveCount(0);
  }
});

test('an Agent opening their own draft by the reader address lands on its management page', async ({ page, api }) => {
  api.roles = ['Agent'];
  api.articles = [hiddenDraft];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto(`/knowledge/${hiddenDraft.id}`);
  await expect(page).toHaveURL(`/knowledge/manage/${hiddenDraft.id}`);
  await expect(page.getByRole('heading', { level: 2, name: hiddenDraft.title })).toBeVisible();
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
