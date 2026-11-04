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
