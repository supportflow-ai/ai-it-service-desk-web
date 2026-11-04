import { describe, expect, it } from 'vitest';
import { defaultArticleListFilters } from '../model/articleList';
import { ArticleStatus } from '../model/knowledge.types';
import { parseKnowledgeSearch, toKnowledgeSearch } from './knowledgeSearch';

describe('knowledge list URL state', () => {
  it('uses the defaults for an empty or garbage query', () => {
    expect(parseKnowledgeSearch(new URLSearchParams())).toEqual(defaultArticleListFilters);
    expect(parseKnowledgeSearch(new URLSearchParams('status=deleted&page=-1&pageSize=7'))).toEqual(defaultArticleListFilters);
    expect(parseKnowledgeSearch(new URLSearchParams('status=1&page=2.5'))).toEqual(defaultArticleListFilters);
  });

  it('round-trips every filter by name and keeps the default URL clean', () => {
    const filters = { status: ArticleStatus.Archived, tag: 'vpn', query: 'mật khẩu', page: 3, pageSize: 20 };
    const search = toKnowledgeSearch(filters);
    expect(search.toString()).toBe('status=archived&tag=vpn&q=m%E1%BA%ADt+kh%E1%BA%A9u&page=3&pageSize=20');
    expect(parseKnowledgeSearch(search)).toEqual(filters);
    expect(toKnowledgeSearch(defaultArticleListFilters).toString()).toBe('');
  });

  it('drops blank text filters', () => {
    expect(toKnowledgeSearch({ ...defaultArticleListFilters, tag: '  ', query: ' ' }).toString()).toBe('');
    expect(parseKnowledgeSearch(new URLSearchParams('tag=%20vpn%20&q=%20'))).toMatchObject({ tag: 'vpn', query: '' });
  });
});
