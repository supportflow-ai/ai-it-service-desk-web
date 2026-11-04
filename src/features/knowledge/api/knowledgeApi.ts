import { apiClient } from '@/shared/api/apiClient';
import type { ArticleListFilters } from '../model/knowledge.types';
import { readArticlePage } from './knowledgeContract';

function listParams({ status, tag, query, page, pageSize }: ArticleListFilters) {
  const trimmedTag = tag.trim();
  const trimmedQuery = query.trim();
  return {
    page,
    pageSize,
    ...(status === null ? {} : { status }),
    ...(trimmedTag ? { tag: trimmedTag } : {}),
    ...(trimmedQuery ? { query: trimmedQuery } : {}),
  };
}

/** Endpoints of backend dev 1506a5b (PR #39) only. */
export const knowledgeApi = {
  /** Staff get every author's articles, of every status unless one is chosen (gap G1). */
  async listArticles(filters: ArticleListFilters, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/knowledge/articles', { params: listParams(filters), signal });
    return readArticlePage(response.data);
  },
};
