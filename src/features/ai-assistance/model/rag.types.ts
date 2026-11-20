import type { ConfidenceBand } from './ai.types';

/**
 * Presentation models for the RAG evidence panel (TC-229: TC-384, TC-385, TC-386).
 * These are NOT an enabled or generated HTTP contract: neither the backend (OpenAPI baseline) nor
 * ai-service (README: "RAG chưa đưa vào MVP") defines a RAG/generation endpoint yet, so the
 * upstream package AISD-S4-02 has not landed. When it does, map its response to these types at
 * the API boundary; change the types only after the real contract is reviewed.
 *
 * IMPORTANT:
 * - `score` values are raw model scores, NOT calibrated probabilities (Spec §11.3).
 * - The provider's failure text is never part of the view: only fixed, allowlisted messages
 *   reach the screen (TC-277).
 */

export const RagOutcome = {
  /** The model answered from retrieved evidence. */
  Answered: 'Answered',
  /** Retrieval found nothing close enough, so the model abstained. Not an error. */
  NoEvidence: 'NoEvidence',
  /** The AI service could not be reached or failed. */
  Unavailable: 'Unavailable',
  /** The AI service did not answer in time. */
  Timeout: 'Timeout',
} as const;
export type RagOutcome = (typeof RagOutcome)[keyof typeof RagOutcome];

/** One piece of evidence: a passage of a Published knowledge article. */
export interface RagCitation {
  articleId: string;
  title: string;
  /** The heading the passage sits under; null for text before the first heading. */
  section: string | null;
  /** The passage as stored (Markdown). Shown as plain text only. */
  snippet: string;
  score: number | null;
  version: number | null;
  publishedAt: string | null;
}

export interface RagSuggestionView {
  outcome: RagOutcome;
  /** The suggested reply, plain text. Shown only together with at least one citation. */
  answer: string | null;
  citations: RagCitation[];
  /** Name of the model that wrote the answer, when the service reports it. */
  model: string | null;
  confidence: ConfidenceBand | null;
  score: number | null;
  generatedAt: string | null;
}
