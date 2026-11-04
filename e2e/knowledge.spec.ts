import { test, expect } from './fixtures';

test('an Agent writes a new article, saves the draft, then saves it again with its revision', async ({ page, api }) => {
  api.roles = ['Agent'];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/knowledge/manage');
  await page.getByRole('button', { name: 'Viết bài mới' }).click();
  await expect(page).toHaveURL('/knowledge/manage/new');

  await page.getByLabel('Tiêu đề').fill('Cách kết nối VPN');
  const tags = page.getByRole('combobox', { name: 'Tags' });
  await tags.fill('VPN');
  await tags.press('Enter');
  await tags.fill('Mạng');
  await tags.press('Enter');
  await page.getByLabel('Nội dung').fill('## Bước 1\n\nMở ứng dụng VPN và đăng nhập.');
  await page.getByRole('tab', { name: 'Xem trước' }).click();
  const preview = page.getByRole('article', { name: 'Xem trước bài viết' });
  await expect(preview.getByRole('heading', { level: 2, name: 'Bước 1' })).toBeVisible();
  await expect(preview.getByText('mạng')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu nháp' }).click();

  await expect(page.getByRole('heading', { name: 'Sửa bản nháp' })).toBeVisible();
  await expect(page.getByText(/Đã tạo bản nháp lúc/)).toBeVisible();
  const created = api.articles[0];
  if (!created) throw new Error('No article was created');
  await expect(page).toHaveURL(`/knowledge/manage/${created.id}/edit`);

  await page.getByLabel('Nội dung').fill('## Bước 1\n\nMở ứng dụng VPN, chọn máy chủ công ty và đăng nhập.');
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/Đã lưu bản nháp lúc/)).toBeVisible();

  expect(api.articleWrites).toEqual([
    { key: 'POST /api/knowledge/articles', body: { title: 'Cách kết nối VPN', content: '## Bước 1\n\nMở ứng dụng VPN và đăng nhập.', tags: ['vpn', 'mạng'] } },
    {
      key: `PUT /api/knowledge/articles/${created.id}/draft`,
      body: { title: 'Cách kết nối VPN', content: '## Bước 1\n\nMở ứng dụng VPN, chọn máy chủ công ty và đăng nhập.', tags: ['vpn', 'mạng'], expectedRevision: 1 },
    },
  ]);

  await page.getByRole('link', { name: /Quay lại danh sách/ }).click();
  await expect(page.getByRole('link', { name: 'Sửa bài Cách kết nối VPN' })).toBeVisible();
});

test('TC-218 demo: create an article, preview it, publish it and find it under Published', async ({ page, api }) => {
  api.roles = ['Agent'];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/knowledge/manage/new');
  await page.getByLabel('Tiêu đề').fill('Đổi mật khẩu Wi-Fi văn phòng');
  await page.getByLabel('Nội dung').fill('## Các bước\n\n1. Mở **Cài đặt**\n2. Chọn mạng `SupportFlow`');
  await page.getByRole('tab', { name: 'Xem trước' }).click();
  await expect(page.getByRole('article', { name: 'Xem trước bài viết' }).getByRole('heading', { level: 2, name: 'Các bước' })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByRole('heading', { name: 'Sửa bản nháp' })).toBeVisible();

  // Unsaved changes hold publishing back, so only saved content is ever published.
  await page.getByRole('tab', { name: 'Viết' }).click();
  await page.getByLabel('Nội dung').fill('## Các bước\n\n1. Mở **Cài đặt**\n2. Chọn mạng `SupportFlow`\n3. Nhập mật khẩu mới');
  await expect(page.getByRole('button', { name: /Xuất bản/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/Đã lưu bản nháp lúc/)).toBeVisible();

  await page.getByRole('button', { name: /Xuất bản/ }).click();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page).toHaveURL('/knowledge/manage?status=published');
  await expect(page.getByRole('tab', { name: /Đã xuất bản/ })).toHaveAttribute('aria-selected', 'true');
  const row = page.getByRole('row', { name: /Đổi mật khẩu Wi-Fi văn phòng/ });
  await expect(row.getByText('Đã xuất bản')).toBeVisible();
  await expect(row.getByRole('button', { name: /Lưu trữ/ })).toBeVisible();

  const created = api.articles[0];
  if (!created) throw new Error('No article was created');
  expect(api.articleWrites.map((write) => write.key)).toEqual([
    'POST /api/knowledge/articles',
    `PUT /api/knowledge/articles/${created.id}/draft`,
    `POST /api/knowledge/articles/${created.id}/publish`,
  ]);
  expect(api.articleWrites[2]?.body).toEqual({ expectedRevision: 2 });
  expect(api.requests).toContain('GET /api/knowledge/articles?page=1&pageSize=10&status=1');
});
