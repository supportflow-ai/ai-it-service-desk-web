import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ownDraft, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { NewArticlePage } from './NewArticlePage';

const content = ['## Bước 1', '', 'Mở ứng dụng VPN.'].join('\n');
let sent: unknown[] = [];
let createStatus = 201;

function EditProbe() {
  const location = useLocation();
  return <output data-testid="opened">{`${location.pathname} ${JSON.stringify(location.state)}`}</output>;
}

function renderNew() {
  const { Wrapper } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={['/knowledge/manage/new']}>
      <Routes>
        <Route path="/knowledge/manage/new" element={<NewArticlePage />} />
        <Route path="/knowledge/manage/:id/edit" element={<EditProbe />} />
        <Route path="/knowledge/manage" element={<p>article list</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

// Pasting instead of typing: antd's auto-sizing text area makes per-key typing very slow in jsdom.
async function fill(label: string, text: string) {
  await userEvent.click(await screen.findByLabelText(label));
  await userEvent.paste(text);
}

beforeEach(() => {
  sent = [];
  createStatus = 201;
  sessionStore.setToken('agent');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })),
    http.post('http://localhost/api/knowledge/articles', async ({ request }) => {
      sent.push(await request.json());
      return createStatus === 201 ? HttpResponse.json(ownDraft, { status: 201 }) : new HttpResponse(null, { status: createStatus });
    }),
  );
});

it('checks the fields like the backend before sending anything', async () => {
  renderNew();
  await userEvent.click(await screen.findByRole('button', { name: 'Lưu nháp' }));
  expect(await screen.findByText('Vui lòng nhập tiêu đề.')).toBeInTheDocument();
  expect(screen.getByText('Vui lòng nhập nội dung.')).toBeInTheDocument();
  await fill('Nội dung', 'Quá ngắn');
  expect(await screen.findByText('Nội dung cần ít nhất 10 ký tự.')).toBeInTheDocument();
  expect(sent).toEqual([]);
});

it('creates the draft with trimmed fields and normalized tags, then opens it for editing', async () => {
  renderNew();
  await fill('Tiêu đề', '  Kết nối VPN  ');
  // Commas split tags here; Enter is covered in the browser (e2e), where rc-select's popup renders.
  await userEvent.type(screen.getByRole('combobox', { name: 'Tags' }), 'VPN,vpn,Mạng,');
  await fill('Nội dung', content);
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  await waitFor(() => expect(sent).toEqual([{ title: 'Kết nối VPN', content, tags: ['vpn', 'mạng'] }]));
  expect(await screen.findByTestId('opened')).toHaveTextContent(
    `/knowledge/manage/${ownDraft.id}/edit {"createdAt":"${ownDraft.createdAt}"}`,
  );
});

it('keeps the form and explains a refusal', async () => {
  createStatus = 403;
  renderNew();
  await fill('Tiêu đề', 'Kết nối VPN');
  await fill('Nội dung', 'Mở ứng dụng VPN rồi đăng nhập.');
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này với bài viết.')).toBeInTheDocument();
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Kết nối VPN');
});

it('goes back to the list on cancel without sending anything', async () => {
  renderNew();
  await userEvent.click(await screen.findByRole('button', { name: 'Hủy' }));
  expect(await screen.findByText('article list')).toBeInTheDocument();
  expect(sent).toEqual([]);
});

it('previews the draft as readers will see it, showing HTML as text instead of running it', async () => {
  renderNew();
  await fill('Tiêu đề', 'Kết nối VPN');
  await userEvent.type(screen.getByRole('combobox', { name: 'Tags' }), 'vpn,');
  await fill('Nội dung', ['## Bước 1', '', 'Mở **VPN**.', '', '<script>window.__xss = 1</script>'].join('\n'));
  await userEvent.click(screen.getByRole('tab', { name: 'Xem trước' }));
  const preview = await screen.findByRole('article', { name: 'Xem trước bài viết' });
  expect(within(preview).getByRole('heading', { level: 3, name: 'Kết nối VPN' })).toBeInTheDocument();
  expect(within(preview).getByRole('heading', { level: 2, name: 'Bước 1' })).toBeInTheDocument();
  expect(within(preview).getByText('VPN', { selector: 'strong' })).toBeInTheDocument();
  expect(within(preview).getByText('vpn')).toBeInTheDocument();
  expect(preview.querySelector('script')).toBeNull();
  expect(preview).toHaveTextContent('<script>window.__xss = 1</script>');
});

it('says there is nothing to preview yet, and returns to the write tab when a save fails its checks', async () => {
  renderNew();
  await userEvent.click(await screen.findByRole('tab', { name: 'Xem trước' }));
  expect(await screen.findByText('Chưa có nội dung để xem trước.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  expect(await screen.findByText('Vui lòng nhập nội dung.')).toBeVisible();
  expect(screen.getByRole('tab', { name: 'Viết' })).toHaveAttribute('aria-selected', 'true');
  expect(sent).toEqual([]);
});
