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
