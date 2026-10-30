import type { ConfidenceBand, Impact, TriageOutcome, Urgency } from './ai.types';

export const confidenceLabels: Record<ConfidenceBand, string> = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao' };
export const impactLabels: Record<Impact, string> = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao' };
export const urgencyLabels: Record<Urgency, string> = { Low: 'Thấp', Medium: 'Trung bình', High: 'Cao' };

/**
 * Fixed, user-facing text per failed outcome. The provider's failureReason is never shown:
 * TC-277 requires failure text to be allowlisted before it reaches a screen.
 */
export const triageOutcomeMessages: Record<Exclude<TriageOutcome, 'Success'>, string> = {
  Unavailable: 'Dịch vụ AI tạm thời không khả dụng.',
  Timeout: 'AI phản hồi quá thời gian cho phép.',
  InvalidResponse: 'Kết quả AI không hợp lệ nên đã bị loại.',
  ValidationFailed: 'Kết quả AI không qua được kiểm tra nên đã bị loại.',
};

/** A missing or Low band means a human should look before relying on the suggestion. */
export function needsReview(band: ConfidenceBand | null) {
  return band === null || band === 'Low';
}
