/** ArticleStatus at backend dev 1506a5b, sent as a number. */
export enum ArticleStatus {
  Draft = 0,
  Published = 1,
  Archived = 2,
}

/** ArticleDto at backend dev 1506a5b (KnowledgeEndpoints). It carries no author name. */
export interface ArticleDto {
  id: string;
  title: string;
  /** Markdown, stored as typed: the backend does not sanitize it. */
  content: string;
  status: ArticleStatus;
  authorId: string;
  /** Stays 1: published articles are not versioned yet (Spec §8.3 allows Draft → Published only). */
  version: number;
  /** Sent back as expectedRevision; an outdated one is refused with 409. */
  revision: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface PagedArticleResult {
  items: ArticleDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** POST /knowledge/articles and PUT /knowledge/articles/{id}/draft take these fields. */
export interface ArticleDraftPayload {
  title: string;
  /** Markdown. */
  content: string;
  tags: string[];
}

/** GET /knowledge/articles: staff get every status unless one is chosen. */
export interface ArticleListFilters {
  status: ArticleStatus | null;
  tag: string;
  query: string;
  page: number;
  pageSize: number;
}
