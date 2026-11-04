import { describe, expect, it } from 'vitest';
import type { User } from '@/features/auth';
import { ArticleStatus } from './knowledge.types';
import { canEditArticle, canManageKnowledge, canOpenArticle, isArticleAuthor } from './knowledgePermissions';

function userWith(roles: User['roles'], userId = `user-${roles.join('-')}`): User {
  return { userId, email: 'synthetic@example.invalid', fullName: null, roles };
}

const requester = userWith(['Requester']);
const agent = userWith(['Agent']);
const admin = userWith(['Admin']);

function article(status: ArticleStatus, authorId = 'someone-else') {
  return { status, authorId };
}

describe('knowledge permissions (backend dev 1506a5b)', () => {
  it('lets only Agent and Admin manage knowledge', () => {
    expect(canManageKnowledge(agent)).toBe(true);
    expect(canManageKnowledge(admin)).toBe(true);
    expect(canManageKnowledge(requester)).toBe(false);
    expect(canManageKnowledge(userWith([]))).toBe(false);
    expect(canManageKnowledge(null)).toBe(false);
  });

  it('knows the author from the user id only', () => {
    expect(isArticleAuthor(agent, article(ArticleStatus.Draft, agent.userId))).toBe(true);
    expect(isArticleAuthor(agent, article(ArticleStatus.Draft))).toBe(false);
    expect(isArticleAuthor(null, article(ArticleStatus.Draft))).toBe(false);
  });

  it('lets the author or an Admin edit a Draft, and nobody edit anything else', () => {
    expect(canEditArticle(agent, article(ArticleStatus.Draft, agent.userId))).toBe(true);
    expect(canEditArticle(admin, article(ArticleStatus.Draft))).toBe(true);
    expect(canEditArticle(agent, article(ArticleStatus.Draft))).toBe(false);
    for (const status of [ArticleStatus.Published, ArticleStatus.Archived]) {
      expect(canEditArticle(admin, article(status))).toBe(false);
      expect(canEditArticle(agent, article(status, agent.userId))).toBe(false);
    }
    expect(canEditArticle(requester, article(ArticleStatus.Draft, requester.userId))).toBe(false);
    expect(canEditArticle(null, article(ArticleStatus.Draft))).toBe(false);
  });

  it('opens what GetArticleDetail serves to each role', () => {
    for (const status of [ArticleStatus.Draft, ArticleStatus.Published, ArticleStatus.Archived]) {
      expect(canOpenArticle(admin, article(status))).toBe(true);
      expect(canOpenArticle(agent, article(status, agent.userId))).toBe(true);
    }
    expect(canOpenArticle(agent, article(ArticleStatus.Published))).toBe(true);
    expect(canOpenArticle(agent, article(ArticleStatus.Draft))).toBe(false);
    expect(canOpenArticle(agent, article(ArticleStatus.Archived))).toBe(false);
    expect(canOpenArticle(requester, article(ArticleStatus.Published))).toBe(true);
    // A requester never authors, so even their own id does not open an unpublished article.
    expect(canOpenArticle(requester, article(ArticleStatus.Draft, requester.userId))).toBe(false);
    expect(canOpenArticle(null, article(ArticleStatus.Published))).toBe(false);
  });
});
