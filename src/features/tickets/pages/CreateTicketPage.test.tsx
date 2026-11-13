import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { CreateTicketPage } from './CreateTicketPage';

const uploadUrl = 'https://storage.example.com/servicedesk';
const created = { ...ticketA, requesterId: user.userId };
let calls: string[] = [];

function NewTicketProbe() {
  const location = useLocation();
  return <output data-testid="opened">{`${location.pathname} ${JSON.stringify(location.state)}`}</output>;
}

function renderCreate(aiPanel?: ReactNode) {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/tickets/new']}>
      <Routes>
        <Route path="/tickets/new" element={<CreateTicketPage aiPanel={aiPanel} />} />
        <Route path="/requester-dashboard/tickets/:id" element={<NewTicketProbe />} />
        <Route path="/elsewhere" element={<p>another screen</p>} />
      </Routes>
      <Link to="/elsewhere">Rời màn tạo</Link>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

async function fillForm() {
  await userEvent.type(await screen.findByLabelText(/Tiêu đề yêu cầu/), 'Không vào được VPN');
  await userEvent.click(screen.getByRole('combobox', { name: 'Danh mục sự cố' }));
  await userEvent.click(await screen.findByTitle('VPN'));
  await userEvent.type(screen.getByLabelText('Mô tả chi tiết'), 'Mất kết nối VPN sau khi đổi mật khẩu.');
}

function choose(...files: File[]) {
  fireEvent.change(screen.getByTestId('create-attachment-input'), { target: { files } });
}

beforeEach(() => {
  calls = [];
  sessionStore.setToken('requester');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)),
    http.post('http://localhost/api/tickets', () => { calls.push('create'); return HttpResponse.json(created, { status: 201 }); }),
    // No formData: the raw-PUT shape (jsdom File + FormData hangs MSW on Node 22; POST is covered in e2e).
    http.post(`http://localhost/api/tickets/${created.id}/attachments/upload-url`, async ({ request }) => {
      const { fileName } = await request.json() as { fileName: string };
      calls.push(`upload-url ${fileName}`);
      if (fileName === 'hong.png') return HttpResponse.json({ error: 'Storage unavailable' }, { status: 400 });
      return HttpResponse.json({ uploadUrl, storageKey: `uploads/pending/${created.id}/${fileName}`, expirySeconds: 3600 });
    }),
    http.put(uploadUrl, () => { calls.push('storage'); return new HttpResponse(null, { status: 200 }); }),
    http.post(`http://localhost/api/tickets/${created.id}/attachments/confirm`, async ({ request }) => {
      const body = await request.json() as { fileName: string; fileSizeBytes: number; contentType: string };
      calls.push(`confirm ${body.fileName}`);
      return HttpResponse.json({
        id: '30000000-0000-0000-0000-000000000001', ticketId: created.id, ...body,
        storageKey: `tickets/${created.id}/attachments/1`, uploadedBy: user.userId, createdAt: '2026-11-04T08:00:00Z',
      }, { status: 201 });
    }),
  );
});

it('keeps at most 10 files and says which one did not fit', async () => {
  renderCreate();
  await screen.findByRole('button', { name: 'Gửi yêu cầu' });
  choose(...Array.from({ length: 11 }, (_, index) => new File(['x'], `f${index}.txt`, { type: 'text/plain' })));
  expect(await screen.findByText('f10.txt: Mỗi phiếu chỉ được đính kèm tối đa 10 tệp.')).toBeInTheDocument();
  expect(screen.getByText('f9.txt')).toBeInTheDocument();
  expect(screen.queryByText('f10.txt')).not.toBeInTheDocument();
});

it('shows no invented AI suggestion, confidence, article or department', async () => {
  renderCreate();
  expect(await screen.findByRole('button', { name: 'Gửi yêu cầu' })).toBeInTheDocument();
  expect(screen.queryByText(/92%|FortiClient|Phòng Công nghệ|Bài viết liên quan/)).not.toBeInTheDocument();
  expect(screen.queryByText('Phòng ban')).not.toBeInTheDocument();
});

it('hosts the AI panel the App injects beside the form', async () => {
  renderCreate(<p>AI side panel</p>);
  expect(await screen.findByText('AI side panel')).toBeInTheDocument();
});

it('keeps only files the backend accepts, and lets one be removed', async () => {
  renderCreate();
  await screen.findByRole('button', { name: 'Gửi yêu cầu' });
  choose(new File(['log'], 'log.txt', { type: 'text/plain' }), new File(['x'], 'setup.exe'), new File(['pdf'], 'bien-ban.pdf', { type: 'application/pdf' }));
  expect(await screen.findByText(/setup\.exe: Định dạng '\.exe' không được hỗ trợ/)).toBeInTheDocument();
  expect(screen.getByText('log.txt')).toBeInTheDocument();
  expect(screen.getByText('bien-ban.pdf')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Bỏ tệp log.txt' }));
  expect(screen.queryByText('log.txt')).not.toBeInTheDocument();
  // Choosing files sends nothing: they are uploaded only once the ticket exists.
  expect(calls).toEqual([]);
});

it('creates the ticket first, then attaches each file, and names the ones that failed', async () => {
  renderCreate();
  await fillForm();
  choose(new File(['log'], 'log.txt', { type: 'text/plain' }), new File(['png'], 'hong.png', { type: 'image/png' }));
  await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
  await waitFor(() => expect(screen.getByTestId('opened')).toHaveTextContent(
    `/requester-dashboard/tickets/${created.id} {"failedUploads":["hong.png"]}`,
  ));
  expect(calls).toEqual(['create', 'upload-url log.txt', 'storage', 'confirm log.txt', 'upload-url hong.png']);
});

it('opens the new ticket without a notice when every file was attached', async () => {
  renderCreate();
  await fillForm();
  choose(new File(['log'], 'log.txt', { type: 'text/plain' }));
  await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
  await waitFor(() => expect(screen.getByTestId('opened')).toHaveTextContent(`/requester-dashboard/tickets/${created.id} null`));
});

it('keeps the chosen files and uploads nothing when the ticket cannot be created', async () => {
  server.use(http.post('http://localhost/api/tickets', () => { calls.push('create'); return new HttpResponse(null, { status: 500 }); }));
  renderCreate();
  await fillForm();
  choose(new File(['log'], 'log.txt', { type: 'text/plain' }));
  await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
  expect(await screen.findByText('Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.')).toBeInTheDocument();
  expect(screen.getByText('log.txt')).toBeInTheDocument();
  expect(calls).toEqual(['create']);
});

it('does not pull the person back once they left the screen while files were uploading', async () => {
  let release = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  server.use(http.post(`http://localhost/api/tickets/${created.id}/attachments/upload-url`, async () => {
    calls.push('upload-url (slow)');
    await held;
    return HttpResponse.json({ uploadUrl, storageKey: `uploads/pending/${created.id}/log.txt`, expirySeconds: 3600 });
  }));
  renderCreate();
  await fillForm();
  choose(new File(['log'], 'log.txt', { type: 'text/plain' }));
  await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
  expect(await screen.findByText(/Đang tải tệp 1\/1: log\.txt/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('link', { name: 'Rời màn tạo' }));
  expect(await screen.findByText('another screen')).toBeInTheDocument();
  release();
  // The file is still attached to the ticket, but the person stays where they went.
  await waitFor(() => expect(calls).toContain('confirm log.txt'));
  expect(screen.getByText('another screen')).toBeInTheDocument();
  expect(screen.queryByTestId('opened')).not.toBeInTheDocument();
});
