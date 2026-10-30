import { describe, expect, it } from 'vitest';
import { OVERRIDE_REASON_MAX_LENGTH, validateOverride } from './suggestionDecision';
import { canReviewSuggestion, reviewBlockReason } from './reviewEligibility';

describe('override rules', () => {
  it('needs a different value and a non-blank reason within the limit', () => {
    expect(validateOverride('Low', '', 'x')).toBe('Chọn giá trị thay thế.');
    expect(validateOverride('Low', 'Low', 'x')).toMatch(/trùng gợi ý/);
    expect(validateOverride('Low', 'High', '   ')).toBe('Nhập lý do điều chỉnh.');
    expect(validateOverride('Low', 'High', 'x'.repeat(OVERRIDE_REASON_MAX_LENGTH + 1))).toMatch(/tối đa/);
    expect(validateOverride('Low', 'High', 'Ảnh hưởng cả phòng')).toBeNull();
  });
});

describe('review eligibility', () => {
  it('allows a decision only with a handler, a valid revision and a fresh, non-manual result', () => {
    expect(canReviewSuggestion(0, false, false, true)).toBe(true);
    expect(reviewBlockReason(3, false, false, false)).toMatch(/chưa có API/);
    expect(reviewBlockReason(-1, false, false, true)).toMatch(/revision/);
    expect(reviewBlockReason(1.5, false, false, true)).toMatch(/revision/);
    expect(reviewBlockReason(3, true, false, true)).toMatch(/cũ/);
    expect(reviewBlockReason(3, false, true, true)).toMatch(/thủ công/);
  });
});
