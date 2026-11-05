import type { SemanticArticleGroup, SemanticMatch } from './knowledge.types';

export type RelevanceBand = 'high' | 'medium' | 'low';

/**
 * Score cut-offs. Provisional: the score scale and the bands are for backend AI to settle with the
 * retrieval evaluation (Spec §11, Recall@K/MRR); until then these assume a similarity in [0, 1].
 */
export const relevancePolicy = { high: 0.75, medium: 0.55, threshold: 0.35 } as const;

export function relevanceBand(score: number): RelevanceBand {
  if (score >= relevancePolicy.high) return 'high';
  if (score >= relevancePolicy.medium) return 'medium';
  return 'low';
}

export const relevanceLabels: Record<RelevanceBand, string> = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' };

/** A score as a plain number, never as a percentage (Spec §11.3). */
export function formatModelScore(score: number) {
  return score.toFixed(2);
}

/**
 * What the results area shows (TC-362): only passages at or above the threshold count as matches;
 * `weak` means passages came back but none close enough, `none` that nothing came back.
 */
export function semanticOutcome(matches: readonly SemanticMatch[]) {
  const relevant = matches.filter((match) => match.score >= relevancePolicy.threshold);
  if (relevant.length > 0) return { kind: 'matches' as const, matches: relevant };
  return { kind: matches.length > 0 ? 'weak' as const : 'none' as const, matches: relevant };
}

/** Groups passages by article, each article's closest passage first and the closest article first. */
export function groupMatches(matches: readonly SemanticMatch[]): SemanticArticleGroup[] {
  const byArticle = new Map<string, SemanticMatch[]>();
  for (const match of [...matches].sort((a, b) => b.score - a.score)) {
    const passages = byArticle.get(match.articleId);
    if (passages) passages.push(match);
    else byArticle.set(match.articleId, [match]);
  }
  return [...byArticle.values()].flatMap(([best, ...others]) => (best ? [{
    articleId: best.articleId, title: best.title, tags: best.tags, version: best.version, publishedAt: best.publishedAt, best, others,
  }] : []));
}
