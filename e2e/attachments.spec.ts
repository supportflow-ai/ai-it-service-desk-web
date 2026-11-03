import { test, expect } from './fixtures';
import { ticketA } from '../tests/fixtures';

const uploadUrl = 'https://storage.example.invalid/servicedesk/upload-target';
const storageKey = `tickets/${ticketA.id}/key_log.txt`;

test('requester uploads with a bounded POST policy, confirms and reloads the attachment', async ({ page, api }) => {
  api.presign = { uploadUrl, storageKey, expirySeconds: 3600, formData: { key: storageKey, policy: 'signed-policy', 'Content-Type': 'text/plain' } };
  let stored: { body: string; authorization: string | undefined; contentType: string | undefined } | undefined;
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type' };
  await page.route(uploadUrl, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    stored = {
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
  await page.getByTestId('attachment-input').setInputFiles({ name: 'log.txt', mimeType: 'text/plain', buffer: Buffer.from('hello storage') });

  await expect(page.getByText('log.txt', { exact: true })).toBeVisible();
  expect(stored?.authorization).toBeUndefined();
  expect(stored?.contentType).toMatch(/^multipart\/form-data; boundary=/);
  expect(stored?.body).toContain('name="policy"');
  expect(stored?.body).toContain('signed-policy');
  expect(stored?.body).toContain('hello storage');
  expect(api.requests).toContain(`POST /api/tickets/${ticketA.id}/attachments/confirm`);
  await page.reload();
  await expect(page.getByText('log.txt', { exact: true })).toBeVisible();
  expect(api.requests).toContain(`POST /api/tickets/${ticketA.id}/attachments/upload-url`);

  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Tải xuống/ }).click();
  const downloadTab = await popup;
  await downloadTab.waitForURL(new RegExp(`/servicedesk/${storageKey}\\?signed=1$`));
  expect(api.requests).toContain(`GET /api/tickets/${ticketA.id}/attachments/download-url?storageKey=${encodeURIComponent(storageKey)}`);
});
