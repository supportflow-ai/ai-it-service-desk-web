/**
 * Why a suggestion cannot be decided on right now, or null when it can. Every condition is
 * checked before any request, so a decision is never sent without a real current revision.
 */
export function reviewBlockReason(revision: number | null, stale: boolean, manual: boolean, hasHandler: boolean) {
  if (!hasHandler) return 'Chưa thể ghi quyết định: hệ thống chưa có API review gợi ý AI.';
  if (manual) return 'Ticket cần phân loại thủ công nên không áp dụng gợi ý AI.';
  if (stale) return 'Gợi ý đã cũ: hãy phân tích lại trước khi quyết định.';
  if (revision === null || !Number.isInteger(revision) || revision < 0) {
    return 'Chưa có revision hiện tại của ticket để chống ghi đè nên chưa thể quyết định.';
  }
  return null;
}

export function canReviewSuggestion(revision: number | null, stale: boolean, manual: boolean, hasHandler: boolean) {
  return reviewBlockReason(revision, stale, manual, hasHandler) === null;
}
