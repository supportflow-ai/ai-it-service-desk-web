import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import { ArticleStatus } from '../model/knowledge.types';
import type { ArticleDto, PagedArticleResult } from '../model/knowledge.types';

function isCount(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min;
}

function isDateOrNull(value: unknown) {
  return value === null || typeof value === 'string';
}

function isArticle(value: unknown): value is ArticleDto {
  return isRecord(value)
    && typeof value.id === 'string' && typeof value.title === 'string' && typeof value.content === 'string'
    && Object.values(ArticleStatus).some((status) => typeof status === 'number' && status === value.status)
    && typeof value.authorId === 'string'
    && isCount(value.version, 1) && isCount(value.revision, 0)
    && Array.isArray(value.tags) && value.tags.every((tag) => typeof tag === 'string')
    && typeof value.createdAt === 'string' && typeof value.updatedAt === 'string'
    && isDateOrNull(value.publishedAt) && isDateOrNull(value.archivedAt);
}

export function readArticle(value: unknown): ArticleDto {
  if (!isArticle(value)) throw new AppError('Phản hồi bài viết không hợp lệ.', 'invalid-response');
  return value;
}

export function readArticlePage(value: unknown): PagedArticleResult {
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.every(isArticle)
    || !isCount(value.page, 1) || !isCount(value.pageSize, 1)
    || !isCount(value.totalCount, 0) || !isCount(value.totalPages, 0)) {
    throw new AppError('Phản hồi danh sách bài viết không hợp lệ.', 'invalid-response');
  }
  return { items: value.items, page: value.page, pageSize: value.pageSize, totalCount: value.totalCount, totalPages: value.totalPages };
}
