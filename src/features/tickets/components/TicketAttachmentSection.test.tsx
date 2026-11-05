import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketStatus } from '../model/ticket.types';
import { TicketAttachmentSection } from './TicketAttachmentSection';

const uploadUrl = 'https://storage.example.com/servicedesk';
const pendingKey = `uploads/pending/${ticketA.id}/0001`;
// No formData: the raw-PUT shape. The POST-policy shape is covered in e2e (jsdom File + FormData hangs MSW on Node 22).
const presign = { uploadUrl, storageKey: pendingKey, expirySeconds: 3600 };
const attachment = {
  id: '30000000-0000-0000-0000-000000000001', ticketId: ticketA.id, fileName: 'log.txt', fileSizeBytes: 5,
  contentType: 'text/plain', storageKey: `tickets/${ticketA.id}/attachments/0001`, uploadedBy: user.userId,
  createdAt: '2026-11-03T08:00:00Z',
};
const listUrl = `http://localhost/api/tickets/${ticketA.id}/attachments`;

let stored: (typeof attachment)[] = [];
let listReads = 0;

function renderSection(status = TicketStatus.Submitted) {
  const { Wrapper, queryClient } = createTestWrapper();
  render(<TicketAttachmentSection ticketId={ticketA.id} status={status} />, { wrapper: Wrapper });
  return queryClient;
}

function pick(file: File) {
  fireEvent.change(screen.getByTestId('attachment-input'), { target: { files: [file] } });
}

beforeEach(() => {
  stored = [];
  listReads = 0;
  sessionStore.setToken('requester');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)),
    http.get(listUrl, () => { listReads += 1; return HttpResponse.json(stored); }),
  );
});

afterEach(() => vi.restoreAllMocks());

it('lists the attachments the backend stores for the ticket, so they survive a reload', async () => {
  stored = [attachment];
  renderSection();
  expect(await screen.findByText('log.txt')).toBeInTheDocument();
  expect(screen.getByText('Tệp đính kèm (1)')).toBeInTheDocument();
});

it('rejects a disallowed file locally without calling the API', async () => {
  renderSection();
  await screen.findByText(/Chưa có tệp đính kèm nào/);
  pick(new File(['x'], 'setup.exe', { type: 'application/octet-stream' }));
  // Any request here would fail the test through the unhandled-request guard.
  expect(await screen.findByText(/'\.exe' không được hỗ trợ/)).toBeInTheDocument();
});

it('uploads to storage without the API token, confirms the file, then shows it from the refreshed list', async () => {
  const requested: unknown[] = [];
  const confirmed: unknown[] = [];
  let storage: { method: string; authorization: string | null } | undefined;
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, async ({ request }) => {
      requested.push(await request.json());
      return HttpResponse.json(presign);
    }),
    http.put(uploadUrl, ({ request }) => {
      storage = { method: request.method, authorization: request.headers.get('authorization') };
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, async ({ request }) => {
      confirmed.push(await request.json());
      stored = [attachment];
      return HttpResponse.json(attachment, { status: 201 });
    }),
  );
  renderSection();
  await screen.findByText(/Chưa có tệp đính kèm nào/);
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));

  expect(await screen.findByText('log.txt')).toBeInTheDocument();
  const metadata = { fileName: 'log.txt', fileSizeBytes: 5, contentType: 'text/plain' };
  expect(requested).toEqual([metadata]);
  expect(storage).toEqual({ method: 'PUT', authorization: null });
  expect(confirmed).toEqual([{ ...metadata, storageKey: pendingKey }]);
  expect(listReads).toBe(2);
  expect(screen.getByText('Tệp đính kèm (1)')).toBeInTheDocument();
});

it('does not confirm or list a file the storage rejected', async () => {
  let confirms = 0;
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json(presign)),
    http.put(uploadUrl, () => new HttpResponse(null, { status: 403 })),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, () => { confirms += 1; return HttpResponse.json(attachment, { status: 201 }); }),
  );
  renderSection();
  await screen.findByText(/Chưa có tệp đính kèm nào/);
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));
  expect(await screen.findByText(/Không tải được tệp lên kho lưu trữ/)).toBeInTheDocument();
  expect(confirms).toBe(0);
  expect(screen.getByText('Tệp đính kèm (0)')).toBeInTheDocument();
});

it('explains a rejected confirmation and does not show the file as attached', async () => {
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json(presign)),
    http.put(uploadUrl, () => new HttpResponse(null, { status: 200 })),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, () => (
      HttpResponse.json({ error: 'Yêu cầu upload đã hết hạn.' }, { status: 400 })
    )),
  );
  renderSection();
  await screen.findByText(/Chưa có tệp đính kèm nào/);
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));
  expect(await screen.findByText(/Không thể đính kèm tệp/)).toBeInTheDocument();
  expect(screen.queryByText('log.txt')).not.toBeInTheDocument();
  expect(listReads).toBe(1);
});

it('confirms again with the same storage key after a temporary failure, without uploading the file twice', async () => {
  let uploadUrlCalls = 0;
  let storagePuts = 0;
  const confirmed: unknown[] = [];
  let confirmStatus = 503;
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => { uploadUrlCalls += 1; return HttpResponse.json(presign); }),
    http.put(uploadUrl, () => { storagePuts += 1; return new HttpResponse(null, { status: 200 }); }),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, async ({ request }) => {
      confirmed.push(await request.json());
      if (confirmStatus !== 201) return HttpResponse.json({ error: 'unavailable' }, { status: confirmStatus });
      stored = [attachment];
      return HttpResponse.json(attachment, { status: 201 });
    }),
  );
  renderSection();
  await screen.findByText(/Chưa có tệp đính kèm nào/);
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));

  expect(await screen.findByText('Tệp log.txt đã tải lên nhưng chưa được xác nhận')).toBeInTheDocument();
  expect(screen.getByText('Tệp đính kèm (0)')).toBeInTheDocument();

  confirmStatus = 201;
  await userEvent.click(screen.getByRole('button', { name: 'Xác nhận lại' }));
  expect(await screen.findByText('Tệp đính kèm (1)')).toBeInTheDocument();
  expect(screen.queryByText(/chưa được xác nhận/)).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(uploadUrlCalls).toBe(1);
  expect(storagePuts).toBe(1);
  const metadata = { fileName: 'log.txt', fileSizeBytes: 5, contentType: 'text/plain', storageKey: pendingKey };
  expect(confirmed).toEqual([metadata, metadata]);
});

it('lets the person give up on an unconfirmed file', async () => {
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json(presign)),
    http.put(uploadUrl, () => new HttpResponse(null, { status: 200 })),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, () => new HttpResponse(null, { status: 503 })),
  );
  renderSection();
  await screen.findByText(/Chưa có tệp đính kèm nào/);
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Bỏ qua' }));
  expect(screen.queryByText(/chưa được xác nhận/)).not.toBeInTheDocument();
  expect(screen.getByText('Tệp đính kèm (0)')).toBeInTheDocument();
});

it('does not offer to confirm again when the backend rejected the upload itself', async () => {
  server.use(
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/upload-url`, () => HttpResponse.json(presign)),
    http.put(uploadUrl, () => new HttpResponse(null, { status: 200 })),
    http.post(`http://localhost/api/tickets/${ticketA.id}/attachments/confirm`, () => HttpResponse.json({ error: 'expired' }, { status: 400 })),
  );
  renderSection();
  await screen.findByText(/Chưa có tệp đính kèm nào/);
  pick(new File(['hello'], 'log.txt', { type: 'text/plain' }));
  expect(await screen.findByText(/Không thể đính kèm tệp/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Xác nhận lại' })).not.toBeInTheDocument();
});

it('downloads a listed file through a fresh authorized URL and reports download failures', async () => {
  stored = [attachment];
  let downloadStatus = 200;
  const opened: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    opened.push(this.href);
  });
  server.use(
    http.get(`http://localhost/api/tickets/${ticketA.id}/attachments/download-url`, ({ request }) => {
      if (downloadStatus !== 200) return new HttpResponse(null, { status: downloadStatus });
      const key = new URL(request.url).searchParams.get('storageKey');
      return HttpResponse.json({ downloadUrl: `https://storage.example.com/servicedesk/${key}?signed=1` });
    }),
  );
  renderSection();
  await userEvent.click(await screen.findByRole('button', { name: /Tải xuống/ }));
  await waitFor(() => expect(opened).toEqual([`https://storage.example.com/servicedesk/${attachment.storageKey}?signed=1`]));

  downloadStatus = 404;
  await userEvent.click(screen.getByRole('button', { name: /Tải xuống/ }));
  expect(await screen.findByText(/Không tải xuống được tệp/)).toBeInTheDocument();
  expect(opened).toHaveLength(1);
});

it('hides cached attachments once access to the ticket is lost', async () => {
  stored = [attachment];
  let denied = false;
  server.use(http.get(listUrl, () => (denied ? new HttpResponse(null, { status: 403 }) : HttpResponse.json(stored))));
  const queryClient = renderSection();
  expect(await screen.findByText('log.txt')).toBeInTheDocument();

  denied = true;
  await act(() => queryClient.invalidateQueries());
  await waitFor(() => expect(screen.queryByText('log.txt')).not.toBeInTheDocument());
  expect(screen.getByText('Tệp đính kèm (0)')).toBeInTheDocument();
});

it('keeps files of an ended ticket downloadable but takes no new ones', async () => {
  stored = [attachment];
  renderSection(TicketStatus.Closed);
  expect(await screen.findByText('log.txt')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Tải xuống/ })).toBeEnabled();
  expect(screen.queryByRole('button', { name: /Đính kèm tệp/ })).not.toBeInTheDocument();
  expect(screen.queryByTestId('attachment-input')).not.toBeInTheDocument();
  expect(screen.getByText(/Ticket đã kết thúc: không đính kèm thêm được/)).toBeInTheDocument();
});
