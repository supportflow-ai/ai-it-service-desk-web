import axios from 'axios';
import { AppError, normalizeError } from './httpError';

// A separate instance: presigned storage URLs must never receive the API bearer token.
const storageClient = axios.create();

export interface PresignedUploadOptions {
  contentType?: string;
  /** Called with 0–100 while the body is sent. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/** Uploads raw binary data to a presigned URL using PUT. */
export async function uploadToPresignedUrl(uploadUrl: string, file: Blob, options: PresignedUploadOptions = {}): Promise<void> {
  const { contentType, onProgress, signal } = options;
  try {
    await storageClient.put(uploadUrl, file, {
      headers: { 'Content-Type': contentType || file.type || 'application/octet-stream' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
      signal,
    });
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized.kind === 'canceled') throw normalized;
    // Storage statuses (e.g. 403 for an expired signature) are not API statuses, so none is
    // attached: callers must not map them to API permission or not-found messages.
    throw new AppError('Không tải được tệp lên kho lưu trữ. Vui lòng thử lại.', normalized.kind);
  }
}
