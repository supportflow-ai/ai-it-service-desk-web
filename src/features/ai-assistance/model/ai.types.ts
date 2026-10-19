import type { TicketCategory } from '@/features/tickets';

/**
 * Panel data models derived from historic Application/AIAssistance models.
 * These are not an enabled or generated HTTP contract.
 *
 * IMPORTANT:
 * - ModelScore is a raw score [0.0, 1.0], NOT a calibrated probability.
 * - ConfidenceBand is a product label for reviewer prioritization.
 * - Priority is NEVER included in AI suggestions — computed by system.
 */

// --- Enums ---

export const Impact = { Low: 'Low', Medium: 'Medium', High: 'High' } as const;
export type Impact = (typeof Impact)[keyof typeof Impact];

export const Urgency = { Low: 'Low', Medium: 'Medium', High: 'High' } as const;
export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const ConfidenceBand = { Low: 'Low', Medium: 'Medium', High: 'High' } as const;
export type ConfidenceBand = (typeof ConfidenceBand)[keyof typeof ConfidenceBand];

export const TriageOutcome = {
  Success: 'Success',
  Unavailable: 'Unavailable',
  Timeout: 'Timeout',
  InvalidResponse: 'InvalidResponse',
  ValidationFailed: 'ValidationFailed',
} as const;
export type TriageOutcome = (typeof TriageOutcome)[keyof typeof TriageOutcome];

export const SuggestionDecision = {
  Pending: 'Pending',
  Accepted: 'Accepted',
  Overridden: 'Overridden',
  Rejected: 'Rejected',
  Expired: 'Expired',
} as const;
export type SuggestionDecision = (typeof SuggestionDecision)[keyof typeof SuggestionDecision];

export const SuggestionType = {
  Category: 'Category',
  Impact: 'Impact',
  Urgency: 'Urgency',
} as const;
export type SuggestionType = (typeof SuggestionType)[keyof typeof SuggestionType];

// --- Panel data contracts ---

/** Requester-safe projection — no Impact/Urgency/raw scores. */
export interface RequesterTriageView {
  outcome: TriageOutcome;
  suggestedCategory: TicketCategory | null;
  categoryConfidence: ConfidenceBand | null;
  requiresManualTriage: boolean;
  failureReason: string | null;
}

/** Agent/Admin presentation projection. HTTP endpoints are not enabled at the baseline. */
export interface AgentTriageView {
  outcome: TriageOutcome;
  suggestedCategory: TicketCategory | null;
  suggestedImpact: Impact | null;
  suggestedUrgency: Urgency | null;
  categoryScore: number | null;
  impactScore: number | null;
  urgencyScore: number | null;
  categoryConfidence: ConfidenceBand | null;
  impactConfidence: ConfidenceBand | null;
  urgencyConfidence: ConfidenceBand | null;
  requiresManualTriage: boolean;
  failureReason: string | null;
  validationErrors: string[];
}

export interface SuggestionDto {
  id: string;
  analysisId: string;
  type: SuggestionType;
  suggestedValue: string;
  modelScore: number | null;
  decision: SuggestionDecision;
  finalValue: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface SuggestionDecisionRequest {
  decision: 'Accepted' | 'Overridden' | 'Rejected';
  finalValue?: string;
  ticketRevision: number;
}
