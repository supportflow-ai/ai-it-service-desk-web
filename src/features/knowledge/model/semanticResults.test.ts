import { describe, expect, it } from 'vitest';
import type { SemanticMatch } from './knowledge.types';
import { formatModelScore, groupMatches, relevanceBand, relevancePolicy, semanticOutcome } from './semanticResults';

const match = (articleId: string, score: number, section: string | null = null): SemanticMatch => ({
  articleId, title: `Bài ${articleId}`, section, snippet: 'Đoạn khớp', score, tags: [], version: 1, publishedAt: '2026-11-03T08:00:00Z',
});

describe('semantic results', () => {
  it('bands a score by the provisional cut-offs', () => {
    expect(relevanceBand(relevancePolicy.high)).toBe('high');
    expect(relevanceBand(relevancePolicy.high - 0.01)).toBe('medium');
    expect(relevanceBand(relevancePolicy.medium)).toBe('medium');
    expect(relevanceBand(relevancePolicy.medium - 0.01)).toBe('low');
  });

  it('shows a score as a plain number, never as a percentage (Spec §11.3)', () => {
    expect(formatModelScore(0.8234)).toBe('0.82');
    expect(formatModelScore(1)).toBe('1.00');
  });

  it('groups passages by source article, the closest passage and the closest article first', () => {
    const groups = groupMatches([match('a', 0.6, 'Bước 2'), match('b', 0.9, 'Lỗi 809'), match('a', 0.8, 'Bước 1'), match('a', 0.5, null)]);
    expect(groups.map((group) => group.articleId)).toEqual(['b', 'a']);
    expect(groups[1]?.best.section).toBe('Bước 1');
    expect(groups[1]?.others.map((other) => other.section)).toEqual(['Bước 2', null]);
    expect(groupMatches([])).toEqual([]);
  });
});

describe('semantic outcome', () => {
  it('counts only passages at or above the threshold as matches', () => {
    const outcome = semanticOutcome([match('a', relevancePolicy.threshold), match('b', relevancePolicy.threshold - 0.01)]);
    expect(outcome.kind).toBe('matches');
    expect(outcome.matches.map((hit) => hit.articleId)).toEqual(['a']);
  });

  it('tells passages too weak to show from no passages at all', () => {
    expect(semanticOutcome([match('a', relevancePolicy.threshold - 0.01)])).toEqual({ kind: 'weak', matches: [] });
    expect(semanticOutcome([])).toEqual({ kind: 'none', matches: [] });
  });
});
