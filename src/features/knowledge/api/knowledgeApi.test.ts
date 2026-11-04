import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { articlePage, othersPublished, ownDraft } from '../../../../tests/fixtures';
import { ArticleStatus } from '../model/knowledge.types';
import { knowledgeApi } from './knowledgeApi';

const listUrl = 'http://localhost/api/knowledge/articles';
const filters = { status: null, tag: '', query: '', page: 1, pageSize: 10 };

it('sends the list filters, trimmed, and omits the ones that are not set', async () => {
  const seen: Record<string, string>[] = [];
  server.use(http.get(listUrl, ({ request }) => {
    seen.push(Object.fromEntries(new URL(request.url).searchParams));
    return HttpResponse.json(articlePage([ownDraft]));
  }));
  await knowledgeApi.listArticles(filters);
  await knowledgeApi.listArticles({ status: ArticleStatus.Draft, tag: ' vpn ', query: ' mật khẩu ', page: 2, pageSize: 20 });
  await knowledgeApi.listArticles({ ...filters, status: ArticleStatus.Published, tag: '   ' });
  expect(seen).toEqual([
    { page: '1', pageSize: '10' },
    { page: '2', pageSize: '20', status: '0', tag: 'vpn', query: 'mật khẩu' },
    { page: '1', pageSize: '10', status: '1' },
  ]);
});

it('reads the article page the backend returns', async () => {
  server.use(http.get(listUrl, () => HttpResponse.json(articlePage([ownDraft, othersPublished], 12))));
  const result = await knowledgeApi.listArticles(filters);
  expect(result.items.map((item) => item.id)).toEqual([ownDraft.id, othersPublished.id]);
  expect(result).toMatchObject({ page: 1, pageSize: 10, totalCount: 12, totalPages: 2 });
});

it.each([
  ['an unknown status', { ...ownDraft, status: 5 }],
  ['a string status', { ...ownDraft, status: 'Draft' }],
  ['a missing revision', { ...ownDraft, revision: undefined }],
  ['tags that are not strings', { ...ownDraft, tags: [1] }],
  ['a version below 1', { ...ownDraft, version: 0 }],
  ['a missing publishedAt', { ...ownDraft, publishedAt: undefined }],
])('rejects an article with %s', async (_, article) => {
  server.use(http.get(listUrl, () => HttpResponse.json(articlePage([article]))));
  await expect(knowledgeApi.listArticles(filters)).rejects.toMatchObject({ kind: 'invalid-response' });
});

it('rejects a page without paging metadata', async () => {
  server.use(http.get(listUrl, () => HttpResponse.json({ items: [ownDraft] })));
  await expect(knowledgeApi.listArticles(filters)).rejects.toMatchObject({ kind: 'invalid-response' });
});

it('reads one article, and creates and updates drafts with the backend payloads', async () => {
  const sent: { method: string; path: string; body: unknown }[] = [];
  const record = async (request: Request) => {
    sent.push({ method: request.method, path: new URL(request.url).pathname, body: request.method === 'GET' ? null : await request.json() });
  };
  server.use(
    http.get(`${listUrl}/${ownDraft.id}`, async ({ request }) => { await record(request); return HttpResponse.json(ownDraft); }),
    http.post(listUrl, async ({ request }) => { await record(request); return HttpResponse.json(ownDraft, { status: 201 }); }),
    http.put(`${listUrl}/${ownDraft.id}/draft`, async ({ request }) => { await record(request); return HttpResponse.json({ ...ownDraft, revision: 22 }); }),
  );
  const payload = { title: 'Kết nối VPN', content: 'Mở ứng dụng VPN rồi đăng nhập.', tags: ['vpn'] };
  expect((await knowledgeApi.getArticle(ownDraft.id)).id).toBe(ownDraft.id);
  expect((await knowledgeApi.createDraft(payload)).status).toBe(ArticleStatus.Draft);
  expect((await knowledgeApi.updateDraft(ownDraft.id, payload, 21)).revision).toBe(22);
  expect(sent).toEqual([
    { method: 'GET', path: `/api/knowledge/articles/${ownDraft.id}`, body: null },
    { method: 'POST', path: '/api/knowledge/articles', body: payload },
    { method: 'PUT', path: `/api/knowledge/articles/${ownDraft.id}/draft`, body: { ...payload, expectedRevision: 21 } },
  ]);
});
