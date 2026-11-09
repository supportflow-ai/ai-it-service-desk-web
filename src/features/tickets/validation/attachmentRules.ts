// Mirrors GenerateAttachmentUploadUrlUseCase limits in the backend.
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
// Per-ticket quota, checked by the backend when a file is confirmed (ticket attachment quota, DEC-07).
export const ATTACHMENT_MAX_FILES_PER_TICKET = 10;
export const ATTACHMENT_MAX_TOTAL_BYTES = 50 * 1024 * 1024;
export const ATTACHMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.txt', '.zip'] as const;
export const ATTACHMENT_ACCEPT = ATTACHMENT_EXTENSIONS.join(',');

function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot).toLowerCase() : '';
}

/** Returns a user-facing message, or null when the file may be uploaded. */
export function validateAttachmentFile(file: { name: string; size: number }): string | null {
  const extension = extensionOf(file.name);
  if (!ATTACHMENT_EXTENSIONS.some((allowed) => allowed === extension)) {
    return `Định dạng ${extension ? `'${extension}' ` : ''}không được hỗ trợ. Chỉ chấp nhận PDF, PNG, JPG, DOCX, TXT, ZIP.`;
  }
  if (file.size <= 0 || file.size > ATTACHMENT_MAX_BYTES) {
    return 'Dung lượng tệp phải lớn hơn 0 và tối đa 10 MB.';
  }
  return null;
}

/**
 * Whether one more file fits the ticket's quota: at most 10 files and 50 MiB in total.
 * `existing` are the sizes already attached (or already chosen); the backend still decides.
 */
export function validateTicketCapacity(existing: readonly number[], file: { size: number }): string | null {
  if (existing.length >= ATTACHMENT_MAX_FILES_PER_TICKET) {
    return `Mỗi phiếu chỉ được đính kèm tối đa ${ATTACHMENT_MAX_FILES_PER_TICKET} tệp.`;
  }
  const total = existing.reduce((sum, size) => sum + size, 0) + file.size;
  if (total > ATTACHMENT_MAX_TOTAL_BYTES) {
    return 'Tổng dung lượng tệp đính kèm của mỗi phiếu không được vượt quá 50 MB.';
  }
  return null;
}
