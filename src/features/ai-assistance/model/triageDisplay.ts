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

/** What a reviewer should do with a suggestion, by band (TC-367). */
export interface ReviewHint {
  label: string;
  color: string;
  detail: string;
}

/**
 * Follows the meaning backend ConfidenceBand gives each band: Low "cần xem xét kỹ lưỡng trước khi
 * áp dụng", Medium "khuyến nghị kỹ thuật viên rà soát", High no flag. A missing band (no score, or
 * one ConfidencePolicy rejects) is treated like Low, and says why.
 */
export function reviewHint(band: ConfidenceBand | null): ReviewHint | null {
  if (band === null) return { label: 'Cần xem xét kỹ', color: 'warning', detail: 'AI không có điểm tin cậy cho gợi ý này.' };
  if (band === 'Low') return { label: 'Cần xem xét kỹ', color: 'warning', detail: 'Độ tin cậy thấp: kiểm tra kỹ trước khi áp dụng.' };
  if (band === 'Medium') return { label: 'Nên rà soát', color: 'default', detail: 'Độ tin cậy trung bình: nên đối chiếu với nội dung ticket.' };
  return null;
}
