import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';
import { ArticleStatus } from './knowledge.types';
import type { ArticleDto } from './knowledge.types';

// UI eligibility only: the backend checks every request (KnowledgeEndpoints and the Knowledge use
// cases at dev 1506a5b). The rules are mapped in docs/architecture/knowledge-ui-access-map.md.

type ArticleFacts = Pick<ArticleDto, 'status' | 'authorId'>;

function isAdmin(user: User) {
  return hasAnyRole(user.roles, ['Admin']);
}

/** The admin list, create and the editorial actions need Agent or Admin (RequireAgent). */
export function canManageKnowledge(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

export function isArticleAuthor(user: User | null, article: Pick<ArticleDto, 'authorId'>) {
  return !!user && article.authorId === user.userId;
}

/**
 * UpdateDraftArticleUseCase: the author (an Agent) or an Admin, and only while the article is a
 * Draft; anything else is refused with 403 or 422.
 */
export function canEditArticle(user: User | null, article: ArticleFacts) {
  if (!canManageKnowledge(user) || article.status !== ArticleStatus.Draft) return false;
  return !!user && (isAdmin(user) || isArticleAuthor(user, article));
}

/**
 * GetArticleDetail: an Admin reads every article; an Agent reads Published ones and their own;
 * anyone else Published ones only. The staff list returns more than this (gap G1), so the list
 * uses it to lock the rows that would only open on a "not found" page.
 */
export function canOpenArticle(user: User | null, article: ArticleFacts) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return article.status === ArticleStatus.Published || (canManageKnowledge(user) && isArticleAuthor(user, article));
}
