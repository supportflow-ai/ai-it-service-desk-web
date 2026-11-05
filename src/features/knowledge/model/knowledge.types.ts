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

/** GET /knowledge/articles/search as readers use it (TC-342): Published articles only, so no status. */
export type PublishedSearchFilters = Omit<ArticleListFilters, 'status'>;

/**
 * One semantic search hit (TC-361): a passage of a Published article and how close it is to the
 * question. This is the frontend's shape: the backend has no semantic search contract yet
 * (AISD-S3-07-T03), so the client of TC-360 maps whatever it returns onto it.
 */
export interface SemanticMatch {
  articleId: string;
  title: string;
  /** The heading the passage sits under; null for text before the first heading. */
  section: string | null;
  /** The matching passage, as stored (Markdown). It is only ever shown as plain text. */
  snippet: string;
  /** Ranking score, higher is closer. Not a calibrated probability (Spec §11.3). */
  score: number;
  tags: string[];
  version: number;
  publishedAt: string;
}

/** The passages of one article, its closest first: one card per source article. */
export interface SemanticArticleGroup {
  articleId: string;
  title: string;
  tags: string[];
  version: number;
  publishedAt: string;
  best: SemanticMatch;
  others: SemanticMatch[];
}

