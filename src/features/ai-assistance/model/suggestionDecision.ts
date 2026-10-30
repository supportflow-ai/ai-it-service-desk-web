import type { SuggestionDecision, SuggestionType } from './ai.types';
import { impactLabels } from './triageDisplay';

export const OVERRIDE_REASON_MAX_LENGTH = 500;

export const suggestionTypeLabels: Record<SuggestionType, string> = {
  Category: 'Danh mục',
  Impact: 'Mức ảnh hưởng',
  Urgency: 'Mức khẩn cấp',
};

export const suggestionDecisionLabels: Record<SuggestionDecision, { label: string; color: string }> = {
  Pending: { label: 'Đang chờ', color: 'default' },
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
