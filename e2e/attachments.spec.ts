import { test, expect } from './fixtures';
import { ticketA } from '../tests/fixtures';

const uploadUrl = 'https://storage.example.invalid/servicedesk';
const pendingKey = `uploads/pending/${ticketA.id}/0001`;
const policy = { key: pendingKey, 'Content-Type': 'text/plain', policy: 'signed-policy', 'x-amz-signature': 'signature' };

test('requester uploads through the POST policy, confirms the file and still sees it after a reload', async ({ page, api }) => {
  api.presign = { uploadUrl, storageKey: pendingKey, expirySeconds: 3600, formData: policy };
  let stored: { body: string; authorization: string | undefined; contentType: string | undefined } | undefined;
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type' };
  await page.route(uploadUrl, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    expect(request.method()).toBe('POST');
    stored = {
      body: request.postDataBuffer()?.toString('utf8') ?? '',
      authorization: request.headers().authorization,
      contentType: request.headers()['content-type'],
    };
    return route.fulfill({ status: 204, headers: cors });
  });
  // Context-wide so the download tab opened by the app is routed too.
  await page.context().route('https://storage.example.invalid/servicedesk/tickets/**', (route) => route.fulfill({ status: 200, body: 'file' }));

  await page.addInitScript(() => localStorage.setItem('token', 'restored'));
  await page.goto(`/requester-dashboard/tickets/${ticketA.id}`);
  await expect(page.getByText(/Chưa có tệp đính kèm nào/)).toBeVisible();
  await page.getByTestId('attachment-input').setInputFiles({ name: 'log.txt', mimeType: 'text/plain', buffer: Buffer.from('hello storage') });

  await expect(page.getByText('log.txt', { exact: true })).toBeVisible();
  expect(stored?.authorization).toBeUndefined();
  expect(stored?.contentType).toMatch(/^multipart\/form-data; boundary=/);
  // Every signed field is sent, and the file comes after all of them.
  const fieldOrder = [...(stored?.body ?? '').matchAll(/; name="([^"]+)"/g)].map((match) => match[1]);
  expect(fieldOrder).toEqual([...Object.keys(policy), 'file']);
  expect(stored?.body).toContain('hello storage');
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

test('a file chosen on the create screen is uploaded through the POST policy once the ticket exists', async ({ page, api }) => {
  api.presign = { uploadUrl, storageKey: pendingKey, expirySeconds: 3600, formData: policy };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type' };
  const sent: string[] = [];
  await page.route(uploadUrl, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    sent.push(route.request().postDataBuffer()?.toString('utf8') ?? '');
    return route.fulfill({ status: 204, headers: cors });
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
  expect(sent).toHaveLength(1);
  expect(sent[0]).toContain('paper jam');
  expect(api.confirmedPayloads).toEqual([{ fileName: 'loi-may-in.txt', fileSizeBytes: 9, contentType: 'text/plain', storageKey: pendingKey }]);
  await expect(page.getByText('Tệp đính kèm (1)')).toBeVisible();
  await expect(page.getByText(/chưa đính kèm được một số tệp/)).toHaveCount(0);
});
