import { apiClient } from '@/shared/api/apiClient';
import type { ArticleDraftPayload, ArticleListFilters } from '../model/knowledge.types';
import { readArticle, readArticlePage } from './knowledgeContract';

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
  /** Admin: any article; Agent: Published or their own; anyone else Published only (else 404). */
  async getArticle(id: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(`/knowledge/articles/${encodeURIComponent(id)}`, { signal });
    return readArticle(response.data);
  },
  /** A new Draft (201) authored by the caller; Agent or Admin only. */
  async createDraft(payload: ArticleDraftPayload) {
    const response = await apiClient.post<unknown>('/knowledge/articles', payload);
    return readArticle(response.data);
  },
  /** Author or Admin, Draft only (else 403/422). The backend does not require the revision (gap G6); it is always sent. */
  async updateDraft(id: string, payload: ArticleDraftPayload, expectedRevision: number) {
    const response = await apiClient.put<unknown>(`/knowledge/articles/${encodeURIComponent(id)}/draft`, { ...payload, expectedRevision });
    return readArticle(response.data);
  },
};
