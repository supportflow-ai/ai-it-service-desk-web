import { isRecord } from '@/shared/lib/guards';

export const KNOWLEDGE_ADMIN_PATH = '/knowledge/manage';
export const NEW_ARTICLE_PATH = `${KNOWLEDGE_ADMIN_PATH}/new`;

export function articlePath(articleId: string) {
  return `${KNOWLEDGE_ADMIN_PATH}/${encodeURIComponent(articleId)}`;
}

export function editArticlePath(articleId: string) {
  return `${articlePath(articleId)}/edit`;
}

/** Router state carried from the list to an article and its editor, to come back to the same filters. */
export interface KnowledgeListState {
  listSearch: string;
}

/** The list URL to go back to; only a search string is accepted, so it cannot leave the list. */
export function knowledgeListPath(state: unknown) {
  if (isRecord(state) && typeof state.listSearch === 'string' && /^\?[^#]*$/.test(state.listSearch)) {
    return `${KNOWLEDGE_ADMIN_PATH}${state.listSearch}`;
  }
  return KNOWLEDGE_ADMIN_PATH;
}

/** Keeps only the list state from router state, so nothing else is carried along. */
export function listStateFrom(state: unknown): KnowledgeListState | undefined {
  return isRecord(state) && typeof state.listSearch === 'string' ? { listSearch: state.listSearch } : undefined;
}
