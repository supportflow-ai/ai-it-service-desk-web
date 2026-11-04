import { describe, expect, it } from 'vitest';
import { articlePath, editArticlePath, knowledgeListPath, listStateFrom } from './knowledgePaths';

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
});
