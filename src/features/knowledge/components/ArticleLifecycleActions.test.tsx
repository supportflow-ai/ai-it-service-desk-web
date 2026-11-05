import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { othersDraft, othersPublished, ownDraft, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import type { ArticleDto } from '../model/knowledge.types';
import { ArticleLifecycleActions } from './ArticleLifecycleActions';

const base = 'http://localhost/api/knowledge/articles';
let sent: { action: string; body: unknown }[] = [];
let status = 200;

function renderActions(roles: string[], article: ArticleDto, props: Partial<Parameters<typeof ArticleLifecycleActions>[0]> = {}) {
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  render(<ArticleLifecycleActions article={article} expectedRevision={article.revision} onReload={() => {}} {...props} />, { wrapper: Wrapper });
}

beforeEach(() => {
  sent = [];
  status = 200;
  sessionStore.setToken('agent');
  server.use(http.post(`${base}/:id/:action`, async ({ request, params }) => {
    const action = String(params.action);
    sent.push({ action, body: await request.json() });
    if (status !== 200) return HttpResponse.json({ error: 'refused' }, { status });
    const article = action === 'publish' ? { ...ownDraft, status: 1, publishedAt: '2026-11-04T11:00:00Z' } : { ...othersPublished, status: 2, archivedAt: '2026-11-04T11:00:00Z' };
    return HttpResponse.json({ ...article, revision: article.revision + 1 });
  }));
});

it('publishes the author’s draft after confirmation, with the revision on screen', async () => {
  const onPublished = vi.fn();
  renderActions(['Agent'], ownDraft as ArticleDto, { onPublished });
  await userEvent.click(await screen.findByRole('button', { name: /Xuất bản/ }));
  expect(sent).toEqual([]);
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận xuất bản' }));
  await waitFor(() => expect(sent).toEqual([{ action: 'publish', body: { expectedRevision: ownDraft.revision } }]));
  await waitFor(() => expect(onPublished).toHaveBeenCalledWith(expect.objectContaining({ id: ownDraft.id, status: 1 })));
});

it('archives a published article after confirmation, for an Admin', async () => {
  renderActions(['Admin'], othersPublished as ArticleDto);
  expect(await screen.findByRole('button', { name: /Lưu trữ/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Xuất bản/ })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Lưu trữ/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận lưu trữ' }));
  await waitFor(() => expect(sent).toEqual([{ action: 'archive', body: { expectedRevision: othersPublished.revision } }]));
});

it('sends nothing when the confirmation is declined', async () => {
  renderActions(['Agent'], ownDraft as ArticleDto);
  await userEvent.click(await screen.findByRole('button', { name: /Xuất bản/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Không' }));
  expect(sent).toEqual([]);
});

it.each([
  ['an Agent on another author’s draft', ['Agent'], othersDraft],
  ['an Agent on another author’s published article', ['Agent'], othersPublished],
  ['anyone on an archived article', ['Admin'], { ...ownDraft, status: 2 }],
])('offers nothing to %s', async (_, roles, article) => {
  renderActions(roles, article as ArticleDto);
  await waitFor(() => expect(sent).toEqual([]));
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('holds publishing back with the reason given, e.g. unsaved changes', async () => {
  renderActions(['Agent'], ownDraft as ArticleDto, { publishBlockedReason: 'Lưu nháp trước khi xuất bản.' });
  const button = await screen.findByRole('button', { name: /Xuất bản/ });
  expect(button).toBeDisabled();
});

it('explains a conflict and offers a reload', async () => {
  status = 409;
  const onReload = vi.fn();
  renderActions(['Agent'], ownDraft as ArticleDto, { onReload });
  await userEvent.click(await screen.findByRole('button', { name: /Xuất bản/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận xuất bản' }));
  expect(await screen.findByText(/vừa được người khác cập nhật/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
  expect(screen.queryByText(/vừa được người khác cập nhật/)).not.toBeInTheDocument();
});

it('explains an article that changed state meanwhile (422) and a refusal (403)', async () => {
  status = 422;
  renderActions(['Agent'], ownDraft as ArticleDto);
  await userEvent.click(await screen.findByRole('button', { name: /Xuất bản/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận xuất bản' }));
  expect(await screen.findByText(/Trạng thái bài viết đã thay đổi/)).toBeInTheDocument();
});
