import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { ticketApi } from '../api/ticketApi';
import { validateAttachmentFile } from '../validation/attachmentRules';

export interface UploadedAttachment {
  storageKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export function useUploadAttachment(ticketId: string) {
  const { sessionVersion } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const assertSameSession = () => {
    if (sessionStore.getSnapshot().version !== sessionVersion) {
      throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
    }
  };

  const mutation = useMutation({
    mutationKey: ['tickets', sessionVersion, 'upload-attachment', ticketId],
    mutationFn: async (file: File): Promise<UploadedAttachment> => {
      const contentType = file.type || 'application/octet-stream';
      // 1. Xin presigned upload URL từ backend
      const presigned = await ticketApi.generateAttachmentUploadUrl(ticketId, {
        fileName: file.name,
        fileSizeBytes: file.size,
        contentType,
      });
      assertSameSession();

      // 2. Tải tệp trực tiếp lên MinIO/S3 storage qua pre-signed URL
      await ticketApi.uploadFileToPresignedUrl(presigned.uploadUrl, file, { onProgress: setProgress });
      assertSameSession();

      return {
        storageKey: presigned.storageKey,
        fileName: file.name,
        fileSizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      };
    },
    retry: false,
  });

  /** Validates locally first, so a rejected file never reaches the API. */
  const upload = (file: File, onUploaded: (attachment: UploadedAttachment) => void) => {
    mutation.reset();
    const invalid = validateAttachmentFile(file);
    setValidationError(invalid);
    if (invalid) return;
    setProgress(0);
    mutation.mutate(file, { onSuccess: onUploaded });
  };

  const clearError = () => {
    setValidationError(null);
    mutation.reset();
  };

  return {
    upload,
    progress,
    isUploading: mutation.isPending,
    uploadingFileName: mutation.isPending ? mutation.variables.name : null,
    validationError,
    error: mutation.error,
    clearError,
  };
}
