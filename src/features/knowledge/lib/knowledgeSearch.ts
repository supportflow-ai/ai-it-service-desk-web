import { ARTICLE_PAGE_SIZES, defaultArticleListFilters } from '../model/articleList';
import { ArticleStatus } from '../model/knowledge.types';
import type { ArticleListFilters, PublishedSearchFilters } from '../model/knowledge.types';

const statusNames: Record<ArticleStatus, string> = {
  [ArticleStatus.Draft]: 'draft',
  [ArticleStatus.Published]: 'published',
  [ArticleStatus.Archived]: 'archived',
};
const statuses = [ArticleStatus.Draft, ArticleStatus.Published, ArticleStatus.Archived] as const;

function positiveInt(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && Number.isSafeInteger(parsed) ? parsed : null;
}

/** Reads the admin list filters from the URL; anything unknown falls back to the default. */
export function parseKnowledgeSearch(params: URLSearchParams): ArticleListFilters {
  const statusName = params.get('status');
  const status = statuses.find((value) => statusNames[value] === statusName);
  const pageSize = ARTICLE_PAGE_SIZES.find((size) => size === positiveInt(params.get('pageSize')));
  return {
    status: status ?? null,
    tag: params.get('tag')?.trim() ?? '',
    query: params.get('q')?.trim() ?? '',
    page: positiveInt(params.get('page')) ?? 1,
    pageSize: pageSize ?? defaultArticleListFilters.pageSize,
  };
}

/** Writes only values that differ from the defaults, so the plain list URL stays clean. */
export function toKnowledgeSearch(filters: ArticleListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status !== null) params.set('status', statusNames[filters.status]);
  if (filters.tag.trim()) params.set('tag', filters.tag.trim());
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.page !== 1) params.set('page', String(filters.page));
  if (filters.pageSize !== defaultArticleListFilters.pageSize) params.set('pageSize', String(filters.pageSize));
  return params;
}

/** The reader search keeps the list's names (`q`, `tag`, `page`, `pageSize`); a status in the URL is ignored. */
export function parsePublishedSearch(params: URLSearchParams): PublishedSearchFilters {
  const { tag, query, page, pageSize } = parseKnowledgeSearch(params);
  return { tag, query, page, pageSize };
}

export function toPublishedSearch(filters: PublishedSearchFilters): URLSearchParams {
  return toKnowledgeSearch({ ...filters, status: null });
}
