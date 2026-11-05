import { ArticleStatus } from './knowledge.types';

/** `tone` is the status-tag colour class shared with tickets (ok / wn / er / in). */
export const articleStatusMeta = {
  [ArticleStatus.Draft]: { label: 'Nháp', tone: 'wn' },
  [ArticleStatus.Published]: { label: 'Đã xuất bản', tone: 'ok' },
  [ArticleStatus.Archived]: { label: 'Lưu trữ', tone: '' },
} satisfies Record<ArticleStatus, { label: string; tone: string }>;
