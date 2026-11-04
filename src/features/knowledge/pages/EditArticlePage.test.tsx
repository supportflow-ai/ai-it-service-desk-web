import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { othersDraft, othersPublished, ownDraft, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { knowledgeKeys } from '../api/knowledgeQueries';
import { EditArticlePage } from './EditArticlePage';

const articleUrl = (id: string) => `http://localhost/api/knowledge/articles/${id}`;
let revisions: unknown[] = [];
let updateStatus = 200;
let served: object = ownDraft;

function ListProbe() {
  const location = useLocation();
  return <output data-testid="list">{`${location.pathname}${location.search}`}</output>;
}

function renderEdit(roles = ['Agent'], id = ownDraft.id, state: unknown = null) {
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper, queryClient } = createTestWrapper();
  render(
    <MemoryRouter initialEntries={[{ pathname: `/knowledge/manage/${id}/edit`, state }]}>
      <Routes>
        <Route path="/knowledge/manage/:id/edit" element={<EditArticlePage />} />
        <Route path="/knowledge/manage" element={<ListProbe />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
  return queryClient;
}

beforeEach(() => {
  revisions = [];
  updateStatus = 200;
  served = ownDraft;
  sessionStore.setToken('agent');
  server.use(
    http.get(articleUrl(':id'), () => HttpResponse.json(served)),
    http.put(`${articleUrl(':id')}/draft`, async ({ request }) => {
      const body = await request.json() as { expectedRevision: number; title: string };
      revisions.push(body.expectedRevision);
      if (updateStatus !== 200) return HttpResponse.json({ error: 'refused' }, { status: updateStatus });
      return HttpResponse.json({ ...ownDraft, title: body.title, revision: body.expectedRevision + 1, updatedAt: '2026-11-04T10:15:00Z' });
    }),
  );
});

it('opens the draft prefilled and saves it with its revision, then with the one the save returned', async () => {
  renderEdit(['Agent'], ownDraft.id, { createdAt: ownDraft.createdAt });
  const title = await screen.findByLabelText('Tiêu đề');
  expect(title).toHaveValue(ownDraft.title);
  expect(screen.getByLabelText('Nội dung')).toHaveValue(ownDraft.content);
  expect(screen.getByText(/Đã tạo bản nháp lúc/)).toBeInTheDocument();

  await userEvent.type(title, ' (bổ sung)');
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  expect(await screen.findByText(/Đã lưu bản nháp lúc/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  await waitFor(() => expect(revisions).toEqual([ownDraft.revision, ownDraft.revision + 1]));
});

it('keeps the revision it opened on when a background refetch brings a newer one', async () => {
  const queryClient = renderEdit();
  await screen.findByLabelText('Tiêu đề');
  const key = knowledgeKeys.detail(sessionStore.getSnapshot().version, ownDraft.id);
  expect(queryClient.getQueryData(key)).toMatchObject({ revision: ownDraft.revision });
  act(() => { queryClient.setQueryData(key, { ...ownDraft, revision: 99 }); });
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  await waitFor(() => expect(revisions).toEqual([ownDraft.revision]));
});

it('takes the newer revision only after a reload asked for after a conflict, keeping the typed text', async () => {
  updateStatus = 409;
  renderEdit();
  const title = await screen.findByLabelText('Tiêu đề');
  await userEvent.type(title, ' (bổ sung)');
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  expect(await screen.findByText(/vừa được người khác cập nhật/)).toBeInTheDocument();

  served = { ...ownDraft, revision: 30 };
  updateStatus = 200;
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  await waitFor(() => expect(screen.queryByText(/vừa được người khác cập nhật/)).not.toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  await waitFor(() => expect(revisions).toEqual([ownDraft.revision, 30]));
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue(`${ownDraft.title} (bổ sung)`);
});

it('explains a draft that stopped being one (422) and offers a reload', async () => {
  updateStatus = 422;
  renderEdit();
  await userEvent.click(await screen.findByRole('button', { name: 'Lưu nháp' }));
  expect(await screen.findByText(/không còn là bản nháp/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument();
});

it("does not offer to edit another author's draft to an Agent, but does to an Admin", async () => {
  served = othersDraft;
  renderEdit(['Agent'], othersDraft.id);
  expect(await screen.findByText('Chỉ tác giả hoặc Admin được sửa bản nháp này.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Tiêu đề')).not.toBeInTheDocument();
});

it('lets an Admin edit any draft', async () => {
  served = othersDraft;
  renderEdit(['Admin'], othersDraft.id);
  expect(await screen.findByLabelText('Tiêu đề')).toHaveValue(othersDraft.title);
});

it('explains that published articles cannot be edited', async () => {
  served = othersPublished;
  renderEdit(['Admin'], othersPublished.id);
  expect(await screen.findByText(/Chỉ sửa được bản nháp/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Lưu nháp' })).not.toBeInTheDocument();
});

it('shows not found for a missing article or a malformed address, without saying which', async () => {
  server.use(http.get(articleUrl(ownDraft.id), () => HttpResponse.json({ error: 'Không tìm thấy bài viết.' }, { status: 404 })));
  renderEdit();
  expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
});

it('shows not found for an address that names no article', async () => {
  renderEdit(['Agent'], 'not-an-id');
  expect(await screen.findByText('Không tìm thấy bài viết')).toBeInTheDocument();
});

it('publishes only saved content, then shows the published list', async () => {
  const published: unknown[] = [];
  server.use(http.post(`${articleUrl(':id')}/publish`, async ({ request }) => {
    published.push(await request.json());
    return HttpResponse.json({ ...ownDraft, status: 1, revision: 40, publishedAt: '2026-11-04T11:00:00Z' });
  }));
  renderEdit();
  const title = await screen.findByLabelText('Tiêu đề');
  // Looked up each time: the button is re-created when its tooltip comes and goes.
  const publish = () => screen.getByRole('button', { name: /Xuất bản/ });
  await waitFor(() => expect(publish()).toBeEnabled());

  await userEvent.type(title, ' (bổ sung)');
  await waitFor(() => expect(publish()).toBeDisabled());
  await userEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  expect(await screen.findByText(/Đã lưu bản nháp lúc/)).toBeInTheDocument();
  await waitFor(() => expect(publish()).toBeEnabled());

  await userEvent.click(publish());
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận xuất bản' }));
  // The save returned revision + 1, so publishing carries that one.
  await waitFor(() => expect(published).toEqual([{ expectedRevision: ownDraft.revision + 1 }]));
  expect(await screen.findByTestId('list')).toHaveTextContent('/knowledge/manage?status=published');
});
