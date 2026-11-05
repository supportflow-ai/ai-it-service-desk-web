import { ticketApi } from '../api/ticketApi';
import type { TicketAttachmentDto } from '../model/ticket.types';

interface UploadAttachmentOptions {
  /** 0–100 while the file is sent to storage. */
  onProgress?: (percent: number) => void;
  /** Runs between steps and throws to stop, e.g. when the session changed meanwhile. */
  checkpoint?: () => void;
}

/**
 * Upload URL, then the file straight to storage, then confirm: the file belongs to the ticket
 * only once the backend confirms it.
 */
export async function uploadAttachment(ticketId: string, file: File, { onProgress, checkpoint }: UploadAttachmentOptions = {}): Promise<TicketAttachmentDto> {
  const metadata = { fileName: file.name, fileSizeBytes: file.size, contentType: file.type || 'application/octet-stream' };
  const presigned = await ticketApi.generateAttachmentUploadUrl(ticketId, metadata);
  checkpoint?.();
  await ticketApi.uploadFileToPresignedUrl(presigned.uploadUrl, file, { formData: presigned.formData, onProgress });
  checkpoint?.();
  return ticketApi.confirmAttachmentUpload(ticketId, { ...metadata, storageKey: presigned.storageKey });
}
