import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import { AppError, normalizeError } from './httpError';

// A separate instance: presigned storage URLs must never receive the API bearer token.
const storageClient = axios.create();

export interface PresignedUploadOptions {
  contentType?: string;
  /** Fields of a presigned POST policy. Without them the file is sent as a raw PUT body. */
  formData?: Readonly<Record<string, string>> | null;
  /** Headers the signed PUT URL requires. They win over the inferred Content-Type, because the signature covers them. */
  requiredHeaders?: Readonly<Record<string, string>> | null;
  /** Called with 0–100 while the body is sent. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/** Uploads a file to a presigned URL: a multipart POST for a POST policy, otherwise a raw PUT. */
export async function uploadToPresignedUrl(uploadUrl: string, file: Blob, options: PresignedUploadOptions = {}): Promise<void> {
  const { contentType, formData, requiredHeaders, onProgress, signal } = options;
  const config = {
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (onProgress && event.total) onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
    signal,
  };
  try {
    if (formData) {
      const body = new FormData();
      for (const [name, value] of Object.entries(formData)) body.append(name, value);
      // S3-compatible storage ignores every field after the file, so it must come last.
      body.append('file', file);
      await storageClient.post(uploadUrl, body, config);
    } else {
      // Browsers set Content-Length themselves (from the body, so it matches the signature) and refuse a script-set one.
      const headers: Record<string, string> = Object.fromEntries(
        Object.entries(requiredHeaders ?? {}).filter(([name]) => name.toLowerCase() !== 'content-length'),
      );
      if (!Object.keys(headers).some((name) => name.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = contentType || file.type || 'application/octet-stream';
      }
      await storageClient.put(uploadUrl, file, { ...config, headers });
    }
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized.kind === 'canceled') throw normalized;
    // Storage statuses (e.g. 403 for an expired signature) are not API statuses, so none is
    // attached: callers must not map them to API permission or not-found messages.
    throw new AppError('Không tải được tệp lên kho lưu trữ. Vui lòng thử lại.', normalized.kind);
  }
}
