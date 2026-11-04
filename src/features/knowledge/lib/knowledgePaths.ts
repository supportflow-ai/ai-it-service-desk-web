import { isRecord } from '@/shared/lib/guards';
import { defaultArticleListFilters } from '../model/articleList';
import { toPublishedSearch } from './knowledgeSearch';

/** Where readers search Published articles (TC-342) and read one (TC-343). */
export const KNOWLEDGE_PATH = '/knowledge';
export const KNOWLEDGE_ADMIN_PATH = `${KNOWLEDGE_PATH}/manage`;
export const NEW_ARTICLE_PATH = `${KNOWLEDGE_ADMIN_PATH}/new`;

export function articlePath(articleId: string) {
  return `${KNOWLEDGE_ADMIN_PATH}/${encodeURIComponent(articleId)}`;
}

export function editArticlePath(articleId: string) {
  return `${articlePath(articleId)}/edit`;
}

export function publishedArticlePath(articleId: string) {
  return `${KNOWLEDGE_PATH}/${encodeURIComponent(articleId)}`;
}

/** The reader search narrowed to one tag, from page 1. */
export function knowledgeTagPath(tag: string) {
  return `${KNOWLEDGE_PATH}?${toPublishedSearch({ ...defaultArticleListFilters, tag }).toString()}`;
}

// Only a search string is accepted as a way back, so router state cannot send the user elsewhere.
function backTo(base: string, search: unknown) {
  return typeof search === 'string' && /^\?[^#]*$/.test(search) ? `${base}${search}` : base;
}

/** Router state carried from the list to an article and its editor, to come back to the same filters. */
export interface KnowledgeListState {
  listSearch: string;
}

/** The list URL to go back to. */
export function knowledgeListPath(state: unknown) {
  return backTo(KNOWLEDGE_ADMIN_PATH, isRecord(state) ? state.listSearch : undefined);
}

/** Keeps only the list state from router state, so nothing else is carried along. */
export function listStateFrom(state: unknown): KnowledgeListState | undefined {
  return isRecord(state) && typeof state.listSearch === 'string' ? { listSearch: state.listSearch } : undefined;
}

/** Router state carried from the search results to an article, to come back to the same results. */
export interface KnowledgeResultsState {
  resultsSearch: string;
}

/** The search URL to go back to. */
export function knowledgeResultsPath(state: unknown) {
  return backTo(KNOWLEDGE_PATH, isRecord(state) ? state.resultsSearch : undefined);
}
