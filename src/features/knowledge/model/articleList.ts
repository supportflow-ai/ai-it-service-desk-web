import { ArticleStatus } from './knowledge.types';
import type { ArticleListFilters } from './knowledge.types';

export const ARTICLE_PAGE_SIZES = [10, 20, 50] as const;

export const defaultArticleListFilters: ArticleListFilters = {
  status: null,
  tag: '',
  query: '',
  page: 1,
  pageSize: 10,
};

/** The status tabs of the admin list, in order; `null` is every status. */
export const articleStatusTabs: readonly { status: ArticleStatus | null; label: string }[] = [
  { status: null, label: 'Tất cả' },
  { status: ArticleStatus.Draft, label: 'Nháp' },
  { status: ArticleStatus.Published, label: 'Đã xuất bản' },
  { status: ArticleStatus.Archived, label: 'Lưu trữ' },
];

/** Why the list shows no rows; each case says something different and offers a different way on. */
export type ArticleListEmptyKind = 'loading' | 'failed' | 'pageGone' | 'noMatch' | 'noArticles';

export function articleListEmptyKind(filters: ArticleListFilters, loaded: boolean, failed: boolean): ArticleListEmptyKind {
  // Not yet asked for (signing in) counts as loading: only a request that failed says so.
  if (!loaded) return failed ? 'failed' : 'loading';
  // Past the last page, e.g. once the articles on it no longer match: the others are still there.
  if (filters.page > 1) return 'pageGone';
  const filtered = filters.status !== null || filters.tag !== '' || filters.query !== '';
  return filtered ? 'noMatch' : 'noArticles';
}
