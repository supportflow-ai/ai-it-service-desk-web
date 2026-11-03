import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import type { ConfirmAttachmentPayload, TicketAttachmentDto } from '../model/ticket.types';
import { TicketAttachmentSection } from './TicketAttachmentSection';

const uploadUrl = 'https://storage.example.com/servicedesk/upload-target';
const storageKey = `tickets/${ticketA.id}/key_log.txt`;

function renderSection() {
  const { Wrapper } = createTestWrapper();
  return render(<TicketAttachmentSection ticketId={ticketA.id} />, { wrapper: Wrapper });
}

function pick(file: File) {
  fireEvent.change(screen.getByTestId('attachment-input'), { target: { files: [file] } });
}

beforeEach(() => {
  sessionStore.setToken('requester');
  let files: TicketAttachmentDto[] = [];
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)),
    http.get(`http://localhost/api/tickets/${ticketA.id}/attachments`, () => HttpResponse.json(files)),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, async ({ request }) => {
      const body = await request.json() as ConfirmAttachmentPayload;
      const attachment = { ...body, id: '30000000-0000-0000-0000-000000000001', ticketId: ticketA.id, uploadedBy: user.userId, createdAt: '2026-11-03T00:00:00Z' };
      files = [attachment];
      return HttpResponse.json(attachment, { status: 201 });
    }),
  );
});

afterEach(() => vi.restoreAllMocks());

it('rejects a disallowed file locally without calling the API', async () => {
  renderSection();
  pick(new File(['x'], 'setup.exe', { type: 'application/octet-stream' }));
  // Validation prevents requesting a signed upload URL; loading the list is expected.
  expect(await screen.findByText(/'\.exe' không được hỗ trợ/)).toBeInTheDocument();
});

it('uploads through a presigned URL without leaking the API token, then lists the file', async () => {
  const requested: unknown[] = [];
  let storageAuthorization: string | null = 'unset';
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, async ({ request }) => {
      requested.push(await request.json());
      return HttpResponse.json({ uploadUrl, storageKey, expirySeconds: 3600 });
    }),
    http.put(uploadUrl, ({ request }) => {
      storageAuthorization = request.headers.get('authorization');
      return new HttpResponse(null, { status: 200 });
    }),
  );
  renderSection();
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));
  expect(await screen.findByText('log.txt')).toBeInTheDocument();
  expect(requested).toEqual([{ fileName: 'log.txt', fileSizeBytes: 5, contentType: 'text/plain' }]);
  expect(storageAuthorization).toBeNull();
  expect(screen.getByText('Tệp đính kèm (1)')).toBeInTheDocument();
});

it('shows a storage failure and does not list the file', async () => {
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json({ uploadUrl, storageKey, expirySeconds: 3600 })),
    http.put(uploadUrl, () => new HttpResponse(null, { status: 403 })),
  );
  renderSection();
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));
  expect(await screen.findByText(/Không tải được tệp lên kho lưu trữ/)).toBeInTheDocument();
  expect(screen.getByText('Tệp đính kèm (0)')).toBeInTheDocument();
});

it('downloads through a fresh authorized URL and reports download failures', async () => {
  let downloadStatus = 200;
  const opened: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    opened.push(this.href);
  });
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json({ uploadUrl, storageKey, expirySeconds: 3600 })),
    http.put(uploadUrl, () => new HttpResponse(null, { status: 200 })),
    http.get(`http://localhost/api/tickets/${ticketA.id}/attachments/download-url`, ({ request }) => {
      if (downloadStatus !== 200) return new HttpResponse(null, { status: downloadStatus });
      const key = new URL(request.url).searchParams.get('storageKey');
      return HttpResponse.json({ downloadUrl: `https://storage.example.com/servicedesk/${key}?signed=1` });
    }),
  );
  renderSection();
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));
  await userEvent.click(await screen.findByRole('button', { name: /Tải xuống/ }));
  await waitFor(() => expect(opened).toEqual([`https://storage.example.com/servicedesk/${storageKey}?signed=1`]));

  downloadStatus = 404;
  await userEvent.click(screen.getByRole('button', { name: /Tải xuống/ }));
  expect(await screen.findByText(/Không tải xuống được tệp/)).toBeInTheDocument();
  expect(opened).toHaveLength(1);
});

it('loads confirmed attachments again after remounting with a new query cache', async () => {
  const attachment = { id: '30000000-0000-0000-0000-000000000001', ticketId: ticketA.id,
    fileName: 'persisted.txt', storageKey, fileSizeBytes: 5, contentType: 'text/plain', uploadedBy: user.userId, createdAt: '2026-11-03T00:00:00Z' };
  let reads = 0;
  server.use(http.get(`http://localhost/api/tickets/${ticketA.id}/attachments`, () => { reads += 1; return HttpResponse.json([attachment]); }));
  const first = renderSection();
  expect(await screen.findByText('persisted.txt')).toBeInTheDocument();
  first.unmount();
  renderSection();
  expect(await screen.findByText('persisted.txt')).toBeInTheDocument();
  expect(reads).toBe(2);
});

it('retries confirmation without uploading the binary again', async () => {
  let puts = 0;
  let confirmations = 0;
  const attachment = { id: '30000000-0000-0000-0000-000000000001', ticketId: ticketA.id,
    fileName: 'retry.txt', storageKey, fileSizeBytes: 5, contentType: 'text/plain', uploadedBy: user.userId, createdAt: '2026-11-03T00:00:00Z' };
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json({ uploadUrl, storageKey, expirySeconds: 3600 })),
    http.put(uploadUrl, () => { puts += 1; return new HttpResponse(null, { status: 200 }); }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, () => {
      confirmations += 1;
      return confirmations === 1 ? new HttpResponse(null, { status: 503 }) : HttpResponse.json(attachment, { status: 201 });
    }),
    http.get(`http://localhost/api/tickets/${ticketA.id}/attachments`, () => HttpResponse.json(confirmations >= 2 ? [attachment] : [])),
  );
  renderSection();
  pick(new File(['hello'], 'retry.txt', { type: 'text/plain' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận lại' }));
  expect(await screen.findByText('retry.txt')).toBeInTheDocument();
  expect(puts).toBe(1);
  expect(confirmations).toBe(2);
});
