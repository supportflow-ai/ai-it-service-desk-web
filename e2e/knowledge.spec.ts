import { test, expect } from './fixtures';
import { ownDraft } from '../tests/fixtures';

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

  await page.getByRole('link', { name: /Quay lại bài viết/ }).click();
  await expect(page).toHaveURL(`/knowledge/manage/${created.id}`);
  await expect(page.getByRole('heading', { level: 2, name: 'Cách kết nối VPN' })).toBeVisible();
  await expect(page.getByText('Mở ứng dụng VPN, chọn máy chủ công ty và đăng nhập.')).toBeVisible();
  await page.getByRole('link', { name: /Quay lại danh sách/ }).click();
  await expect(page).toHaveURL('/knowledge/manage');
  await expect(page.getByRole('link', { name: 'Sửa bài Cách kết nối VPN' })).toBeVisible();
});

test('list → article → editor and back keeps the list filters', async ({ page, api }) => {
  api.roles = ['Agent'];
  api.articles = [{ ...ownDraft }];
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/knowledge/manage?status=draft&tag=vpn');
  await page.getByRole('link', { name: ownDraft.title, exact: true }).click();
  await expect(page).toHaveURL(`/knowledge/manage/${ownDraft.id}`);
  await expect(page.getByRole('heading', { level: 2, name: 'Bước 1' })).toBeVisible();

  await page.getByRole('button', { name: 'Sửa' }).click();
  await expect(page).toHaveURL(`/knowledge/manage/${ownDraft.id}/edit`);
  await page.getByRole('button', { name: 'Hủy' }).click();
  await expect(page).toHaveURL(`/knowledge/manage/${ownDraft.id}`);
  await page.getByRole('link', { name: /Quay lại danh sách/ }).click();
  await expect(page).toHaveURL('/knowledge/manage?status=draft&tag=vpn');
  await expect(page.getByRole('tab', { name: /Nháp/ })).toHaveAttribute('aria-selected', 'true');
});

test('reloading the editor with unsaved changes asks first; after saving it does not', async ({ page, api }) => {
  api.roles = ['Agent'];
  api.articles = [{ ...ownDraft }];
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => { dialogs.push(dialog.type()); void dialog.accept(); });
  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto(`/knowledge/manage/${ownDraft.id}/edit`);
  await page.getByLabel('Tiêu đề').fill(`${ownDraft.title} (bổ sung)`);
  await page.reload();
  expect(dialogs).toEqual(['beforeunload']);

  await page.getByLabel('Tiêu đề').fill(`${ownDraft.title} (bổ sung)`);
  await page.getByRole('button', { name: 'Lưu nháp' }).click();
  await expect(page.getByText(/Đã lưu bản nháp lúc/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Tiêu đề')).toHaveValue(`${ownDraft.title} (bổ sung)`);
  expect(dialogs).toEqual(['beforeunload']);
});

test('TC-218 demo: create an article, preview it, publish it, read it and find it under Published', async ({ page, api }) => {
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
  const created = api.articles[0];
  if (!created) throw new Error('No article was created');
  // Published articles are not edited: the editor gives way to the article as readers see it.
  await expect(page).toHaveURL(`/knowledge/manage/${created.id}`);
  await expect(page.getByRole('heading', { level: 2, name: 'Đổi mật khẩu Wi-Fi văn phòng' })).toBeVisible();
  await expect(page.getByText('Nhập mật khẩu mới')).toBeVisible();
  await expect(page.getByRole('button', { name: /Lưu trữ/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sửa' })).toHaveCount(0);

  await page.getByRole('link', { name: /Quay lại danh sách/ }).click();
  await page.getByRole('tab', { name: /Đã xuất bản/ }).click();
  await expect(page).toHaveURL('/knowledge/manage?status=published');
  const row = page.getByRole('row', { name: /Đổi mật khẩu Wi-Fi văn phòng/ });
  await expect(row.getByText('Đã xuất bản')).toBeVisible();
  await expect(row.getByRole('button', { name: /Lưu trữ/ })).toBeVisible();

  expect(api.articleWrites.map((write) => write.key)).toEqual([
    'POST /api/knowledge/articles',
    `PUT /api/knowledge/articles/${created.id}/draft`,
    `POST /api/knowledge/articles/${created.id}/publish`,
  ]);
  expect(api.articleWrites[2]?.body).toEqual({ expectedRevision: 2 });
  expect(api.requests).toContain('GET /api/knowledge/articles?page=1&pageSize=10&status=1');
});
