// Mirrors TicketComment invariants in the backend domain (2–4000 trimmed characters).
export const COMMENT_MIN_LENGTH = 2;
export const COMMENT_MAX_LENGTH = 4000;

/** Returns a user-facing message, or null when the content can be sent. Empty input has no message. */
export function validateCommentContent(content: string): string | null {
  const length = content.trim().length;
  if (length === 0) return null;
  if (length < COMMENT_MIN_LENGTH) return `Nội dung cần ít nhất ${COMMENT_MIN_LENGTH} ký tự.`;
  if (length > COMMENT_MAX_LENGTH) return `Nội dung tối đa ${COMMENT_MAX_LENGTH} ký tự.`;
  return null;
}

export function canSendComment(content: string) {
  return content.trim().length > 0 && validateCommentContent(content) === null;
}
