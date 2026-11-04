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
