import { normalizeError } from '@/shared/api/httpError';
import { ticketApi } from '../api/ticketApi';
import type { TicketAttachmentDto } from '../model/ticket.types';

export interface AttachmentMetadata {
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
}

/** A file that reached storage but that the backend has not confirmed yet. */
export interface UnconfirmedUpload {
  metadata: AttachmentMetadata;
  storageKey: string;
}

interface UploadAttachmentOptions {
  /** 0–100 while the file is sent to storage. */
  onProgress?: (percent: number) => void;
  /** Runs between steps and throws to stop, e.g. when the session changed meanwhile. */
  checkpoint?: () => void;
  /** Called once the file is in storage, before it is confirmed, so a failed confirmation can be repeated. */
  onUploaded?: (upload: UnconfirmedUpload) => void;
}

/**
 * Upload URL, then the file straight to storage, then confirm: the file belongs to the ticket
 * only once the backend confirms it.
 */
export async function uploadAttachment(ticketId: string, file: File, { onProgress, checkpoint, onUploaded }: UploadAttachmentOptions = {}): Promise<TicketAttachmentDto> {
  const metadata = { fileName: file.name, fileSizeBytes: file.size, contentType: file.type || 'application/octet-stream' };
  const presigned = await ticketApi.generateAttachmentUploadUrl(ticketId, metadata);
  checkpoint?.();
  await ticketApi.uploadFileToPresignedUrl(presigned.uploadUrl, file, { formData: presigned.formData, onProgress });
  checkpoint?.();
  const uploaded = { metadata, storageKey: presigned.storageKey };
  onUploaded?.(uploaded);
  return confirmUploadedAttachment(ticketId, uploaded);
}

/** The last step alone: the backend treats a repeated confirmation as the same file, not a second one. */
export function confirmUploadedAttachment(ticketId: string, { metadata, storageKey }: UnconfirmedUpload) {
  return ticketApi.confirmAttachmentUpload(ticketId, { ...metadata, storageKey });
}

/**
 * A confirmation that failed for a reason that may pass (no connection, server unavailable) can be
 * repeated with the same storage key. Anything else, such as an expired or mismatched upload, needs a new upload.
 */
export function isRetryableConfirmError(error: unknown) {
  const { kind, status } = normalizeError(error);
  return kind === 'network' || (status !== undefined && status >= 500);
}
