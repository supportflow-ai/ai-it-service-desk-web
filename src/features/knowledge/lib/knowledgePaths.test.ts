import { describe, expect, it } from 'vitest';
import {
  articlePath, editArticlePath, knowledgeListPath, knowledgeResultsPath, knowledgeTagPath, listStateFrom, publishedArticlePath,
} from './knowledgePaths';

describe('knowledge paths', () => {
  it('builds the read and edit addresses of an article', () => {
    expect(articlePath('40000000-0000-0000-0000-000000000001')).toBe('/knowledge/manage/40000000-0000-0000-0000-000000000001');
    expect(editArticlePath('40000000-0000-0000-0000-000000000001')).toBe('/knowledge/manage/40000000-0000-0000-0000-000000000001/edit');
    expect(articlePath('a/b?c')).toBe('/knowledge/manage/a%2Fb%3Fc');
  });

  it('goes back to the list with the filters it was opened from', () => {
    expect(knowledgeListPath({ listSearch: '?status=draft&tag=vpn&page=2' })).toBe('/knowledge/manage?status=draft&tag=vpn&page=2');
    expect(knowledgeListPath({ listSearch: '' })).toBe('/knowledge/manage');
  });

  it('accepts only a search string, so router state cannot send the user elsewhere', () => {
    for (const listSearch of ['//evil.example', 'https://evil.example', '/admin', '?status=draft#x', 42]) {
      expect(knowledgeListPath({ listSearch })).toBe('/knowledge/manage');
    }
    expect(knowledgeListPath(null)).toBe('/knowledge/manage');
    expect(knowledgeListPath('?status=draft')).toBe('/knowledge/manage');
  });

  it('passes the list state on, and nothing else', () => {
    expect(listStateFrom({ listSearch: '?tag=vpn', createdAt: '2026-11-04T08:00:00Z' })).toEqual({ listSearch: '?tag=vpn' });
    expect(listStateFrom({ createdAt: '2026-11-04T08:00:00Z' })).toBeUndefined();
    expect(listStateFrom(undefined)).toBeUndefined();
  });

  it('builds the reader addresses: an article, and the search narrowed to a tag', () => {
    expect(publishedArticlePath('40000000-0000-0000-0000-000000000001')).toBe('/knowledge/40000000-0000-0000-0000-000000000001');
    expect(publishedArticlePath('a/b')).toBe('/knowledge/a%2Fb');
    expect(knowledgeTagPath('mạng')).toBe('/knowledge?tag=m%E1%BA%A1ng');
  });

  it('goes back to the search results the article was opened from, and only to those', () => {
    expect(knowledgeResultsPath({ resultsSearch: '?q=vpn&page=2' })).toBe('/knowledge?q=vpn&page=2');
    expect(knowledgeResultsPath({ resultsSearch: '' })).toBe('/knowledge');
    expect(knowledgeResultsPath({ resultsSearch: '//evil.example' })).toBe('/knowledge');
    expect(knowledgeResultsPath({ listSearch: '?status=draft' })).toBe('/knowledge');
    expect(knowledgeResultsPath(null)).toBe('/knowledge');
  });
});
