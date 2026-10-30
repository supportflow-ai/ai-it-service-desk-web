// Mirrors GenerateAttachmentUploadUrlUseCase limits in the backend.
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
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
