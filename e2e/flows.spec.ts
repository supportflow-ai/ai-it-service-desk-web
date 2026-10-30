import { test, expect } from './fixtures';
import { ticketA } from '../tests/fixtures';

test('login → own tickets → detail → logout', async ({ page, api }) => {
  await page.goto('/requester-dashboard/tickets');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email', { exact: true }).fill('synthetic@example.invalid');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/requester-dashboard\/tickets$/);
  await page.getByRole('link', { name: ticketA.ticketNumber }).click();
  await expect(page.getByRole('heading', { name: ticketA.title })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  expect(api.requests).toContain('POST /api/auth/login');
});

test('restored session creates a ticket with the existing payload and URL', async ({ page, api }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/tickets/new');
  await page.getByLabel('Tiêu đề yêu cầu').fill('Yêu cầu mạng mới');
  await page.getByLabel('Danh mục sự cố').click();
  await page.getByText('Mạng & Wi-Fi', { exact: true }).click();
  await page.getByLabel('Mô tả chi tiết').fill('Không thể truy cập mạng nội bộ.');
  await page.getByRole('button', { name: 'Gửi yêu cầu', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/requester-dashboard/tickets/${ticketA.id}$`));
  await expect(page.getByRole('heading', { name: ticketA.title })).toBeVisible();
  expect(api.createdPayload).toEqual({ title: 'Yêu cầu mạng mới', categoryId: 'NET', description: 'Không thể truy cập mạng nội bộ.' });
});

test('server paging uses page=2 and displays the returned page', async ({ page, api }) => {
  api.tickets = Array.from({ length: 12 }, (_, index) => ({ ...ticketA,
    id: `10000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
    ticketNumber: `IT-2026-${index + 1}`, title: `Ticket ${index + 1}`,
  }));
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/requester-dashboard/tickets');
  await expect(page.getByRole('link', { name: 'IT-2026-1', exact: true })).toBeVisible();
  await page.locator('.ant-pagination-next').click();
  await expect(page.getByRole('link', { name: 'IT-2026-11', exact: true })).toBeVisible();
  expect(api.requests.some((request) => request.includes('tickets/me?page=2&pageSize=10'))).toBe(true);
});

test('restore error preserves the session and allows retry', async ({ page, api }) => {
  api.meStatus = 500;
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/requester-dashboard/tickets');
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('restored');
  api.meStatus = 200;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('link', { name: ticketA.ticketNumber })).toBeVisible();
});

test('resource 403 preserves the session', async ({ page, api }) => {
  api.detailStatus = 403;
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto(`/requester-dashboard/tickets/${ticketA.id}`);
  await expect(page.getByRole('alert')).toContainText('không có quyền');
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('restored');
});

for (const [role, path, allowed] of [
  ['Requester', '/agent-workspace', false],
  ['Agent', '/agent-workspace', true],
  ['Agent', '/admin-panel', false],
  ['Admin', '/agent-workspace', true],
  ['Admin', '/admin-panel', true],
] as const) {
  test(`${role} route policy: ${path}`, async ({ page, api }) => {
    api.roles = [role];
    await page.addInitScript(() => localStorage.setItem('token', 'restored'));
    await page.goto(path);
    await expect(page).toHaveURL(allowed ? path : '/403');
    if (allowed) await expect(page.getByText(/chưa được hỗ trợ/)).toBeVisible();
    else await expect(page.getByText('Bạn không có quyền truy cập trang này.')).toBeVisible();
  });
}

test('Admin workspace preserves UI with commands and live timeline', async ({ page, api }) => {
  api.roles = ['Admin'];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto(`/agent-workspace/tickets/${ticketA.id}`);
  await expect(page.getByRole('heading', { name: ticketA.title })).toBeVisible();
  await expect(page.getByText('Chưa có trao đổi nào cho ticket này.')).toBeVisible();
  // Backend ClaimTicketUseCase only accepts the Agent role; Admin may cancel a submitted ticket instead.
  await expect(page.getByRole('button', { name: /Hủy vé/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Nhận xử lý/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Gửi bình luận', exact: true })).toBeDisabled();
  await expect(page.getByText('Ticket được tạo mới')).toHaveCount(0);
  expect(api.requests).toEqual(['GET /api/auth/me', `GET /api/tickets/${ticketA.id}`, `GET /api/tickets/${ticketA.id}/timeline`]);
});
