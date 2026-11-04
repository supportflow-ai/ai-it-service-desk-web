import { describe, expect, it } from 'vitest';
import { articleListEmptyKind, defaultArticleListFilters } from './articleList';
import { ArticleStatus } from './knowledge.types';

describe('why the article list is empty', () => {
  it('is not empty at all before the first page arrives, or when it failed to', () => {
    expect(articleListEmptyKind(defaultArticleListFilters, false, false)).toBe('loading');
    expect(articleListEmptyKind(defaultArticleListFilters, false, true)).toBe('failed');
  });

  it('tells a page past the end from a filter that matches nothing, and from an empty base', () => {
    expect(articleListEmptyKind({ ...defaultArticleListFilters, page: 3 }, true, false)).toBe('pageGone');
    expect(articleListEmptyKind({ ...defaultArticleListFilters, status: ArticleStatus.Archived }, true, false)).toBe('noMatch');
    expect(articleListEmptyKind({ ...defaultArticleListFilters, tag: 'vpn' }, true, false)).toBe('noMatch');
    expect(articleListEmptyKind({ ...defaultArticleListFilters, query: 'mật khẩu' }, true, false)).toBe('noMatch');
    expect(articleListEmptyKind({ ...defaultArticleListFilters, pageSize: 50 }, true, false)).toBe('noArticles');
  });
});
