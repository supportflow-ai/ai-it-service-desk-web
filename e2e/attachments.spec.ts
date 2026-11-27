import { test, expect } from './fixtures';
import { ticketA } from '../tests/fixtures';

const uploadUrl = 'https://storage.example.invalid/servicedesk';
const pendingKey = `uploads/pending/${ticketA.id}/0001`;
// Like R2: a presigned PUT has no form fields and requires only the signed Content-Type.
const presign = {
  uploadUrl,
  storageKey: pendingKey,
  expirySeconds: 900,
  formData: null,
  requiredHeaders: { 'Content-Type': 'text/plain' },
};
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'PUT', 'Access-Control-Allow-Headers': 'content-type' };

test('requester uploads through the presigned PUT, confirms the file and still sees it after a reload', async ({ page, api }) => {
  api.presign = presign;
  let stored: { method: string; body: string; authorization: string | undefined; contentType: string | undefined } | undefined;
  await page.route(uploadUrl, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    stored = {
      method: request.method(),
      body: request.postDataBuffer()?.toString('utf8') ?? '',
      authorization: request.headers().authorization,
      contentType: request.headers()['content-type'],
    };
    return route.fulfill({ status: 200, headers: cors });
  });
  // Context-wide so the download tab opened by the app is routed too.
  await page.context().route('https://storage.example.invalid/servicedesk/tickets/**', (route) => route.fulfill({ status: 200, body: 'file' }));

  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto(`/requester-dashboard/tickets/${ticketA.id}`);
  await expect(page.getByText(/Chưa có tệp đính kèm nào/)).toBeVisible();
  await page.getByTestId('attachment-input').setInputFiles({ name: 'log.txt', mimeType: 'text/plain', buffer: Buffer.from('hello storage') });

  await expect(page.getByText('log.txt', { exact: true })).toBeVisible();
  expect(stored?.method).toBe('PUT');
  expect(stored?.authorization).toBeUndefined();
  // The raw file is the body, and Content-Type is the one the URL was signed with.
  expect(stored?.contentType).toBe('text/plain');
  expect(stored?.body).toBe('hello storage');
  expect(api.confirmedPayloads).toEqual([{ fileName: 'log.txt', fileSizeBytes: 13, contentType: 'text/plain', storageKey: pendingKey }]);

  // The list comes from the backend, so the confirmed file survives a reload.
  await page.reload();
  await expect(page.getByText('log.txt', { exact: true })).toBeVisible();
  await expect(page.getByText('Tệp đính kèm (1)')).toBeVisible();

  const storageKey = `tickets/${ticketA.id}/attachments/1`;
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Tải xuống/ }).click();
  const downloadTab = await popup;
  await downloadTab.waitForURL(new RegExp(`/servicedesk/${storageKey}\\?signed=1$`));
  expect(api.requests).toContain(`GET /api/tickets/${ticketA.id}/attachments/download-url?storageKey=${encodeURIComponent(storageKey)}`);
});

test('a file chosen on the create screen is uploaded through the presigned PUT once the ticket exists', async ({ page, api }) => {
  api.presign = { ...presign, requiredHeaders: { 'Content-Type': 'text/plain' } };
  const sent: { method: string; body: string; contentType: string | undefined }[] = [];
  await page.route(uploadUrl, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    sent.push({ method: request.method(), body: request.postDataBuffer()?.toString('utf8') ?? '', contentType: request.headers()['content-type'] });
    return route.fulfill({ status: 200, headers: cors });
  });
  const created = page.waitForRequest((request) => request.method() === 'POST' && new URL(request.url()).pathname === '/api/tickets');

  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto('/tickets/new');
  await page.getByLabel('Tiêu đề yêu cầu').fill('Không in được báo cáo');
  await page.getByLabel('Danh mục sự cố').click();
  await page.getByText('Máy in', { exact: true }).click();
  await page.getByLabel('Mô tả chi tiết').fill('Máy in tầng 3 báo lỗi kẹt giấy liên tục.');
  await page.getByTestId('create-attachment-input').setInputFiles({ name: 'loi-may-in.txt', mimeType: 'text/plain', buffer: Buffer.from('paper jam') });
  await expect(page.getByText('loi-may-in.txt', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Gửi yêu cầu', exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/requester-dashboard/tickets/${ticketA.id}$`));
  expect((await created).headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/);
  expect(api.createdPayload).toEqual({ title: 'Không in được báo cáo', categoryId: 'PRINT', description: 'Máy in tầng 3 báo lỗi kẹt giấy liên tục.' });
  expect(sent).toEqual([{ method: 'PUT', body: 'paper jam', contentType: 'text/plain' }]);
  expect(api.confirmedPayloads).toEqual([{ fileName: 'loi-may-in.txt', fileSizeBytes: 9, contentType: 'text/plain', storageKey: pendingKey }]);
  await expect(page.getByText('Tệp đính kèm (1)')).toBeVisible();
  await expect(page.getByText(/chưa đính kèm được một số tệp/)).toHaveCount(0);
});
