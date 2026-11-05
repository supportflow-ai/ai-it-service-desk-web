import type { SuggestionDecision, SuggestionType } from './ai.types';
import { impactLabels } from './triageDisplay';

export const OVERRIDE_REASON_MAX_LENGTH = 500;

export const suggestionTypeLabels: Record<SuggestionType, string> = {
  Category: 'Danh mục',
  Impact: 'Mức ảnh hưởng',
  Urgency: 'Mức khẩn cấp',
};

export const suggestionDecisionLabels: Record<SuggestionDecision, { label: string; color: string }> = {
  Pending: { label: 'Chờ quyết định', color: 'gold' },
  Accepted: { label: 'Đã chấp nhận', color: 'green' },
  Overridden: { label: 'Đã điều chỉnh', color: 'blue' },
  Rejected: { label: 'Đã từ chối', color: 'red' },
  Expired: { label: 'Hết hạn', color: 'default' },
};

/** Impact and Urgency share the Low/Medium/High scale. */
export const levelOptions = Object.entries(impactLabels).map(([value, label]) => ({ value, label }));

/** Returns a user-facing message, or null when the override can be sent. */
export function validateOverride(suggestedValue: string, finalValue: string, reason: string) {
  if (!finalValue) return 'Chọn giá trị thay thế.';
  if (finalValue === suggestedValue) return 'Giá trị thay thế trùng gợi ý; hãy dùng "Chấp nhận".';
  const trimmed = reason.trim();
  if (!trimmed) return 'Nhập lý do điều chỉnh.';
  if (trimmed.length > OVERRIDE_REASON_MAX_LENGTH) return `Lý do tối đa ${OVERRIDE_REASON_MAX_LENGTH} ký tự.`;
  return null;
}

/**
 * What a decision did to the ticket, in words (TC-367). Values are display labels. Expired is set
 * by the system when the ticket changed after the analysis (AISuggestion.MarkExpired).
 */
export function decisionSummary(decision: SuggestionDecision, suggested: string, final: string | null) {
  switch (decision) {
    case 'Pending': return 'Chưa có quyết định: gợi ý chưa được áp dụng vào ticket.';
    case 'Accepted': return `Đã áp dụng giá trị AI gợi ý: ${final ?? suggested}.`;
    case 'Overridden': return `Kỹ thuật viên chọn ${final ?? '—'} thay cho gợi ý ${suggested}.`;
    case 'Rejected': return 'Không áp dụng giá trị nào từ AI.';
    case 'Expired': return 'Ticket đã thay đổi sau khi AI phân tích nên gợi ý hết hiệu lực; hãy phân tích lại.';
  }
}
