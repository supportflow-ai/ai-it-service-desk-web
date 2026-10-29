import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.txt', '.zip'];

export interface UploadedAttachment {
  storageKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export function useUploadAttachment(ticketId: string) {
  const { sessionVersion } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ['tickets', sessionVersion, 'upload-attachment', ticketId],
    mutationFn: async (file: File): Promise<UploadedAttachment> => {
      setValidationError(null);

      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        const msg = `Định dạng '${ext}' không được hỗ trợ. Chỉ chấp nhận PDF, PNG, JPG, DOCX, TXT, ZIP.`;
        setValidationError(msg);
        throw new Error(msg);
      }

      if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
        const msg = 'Dung lượng tệp phải lớn hơn 0 và tối đa 10 MB.';
        setValidationError(msg);
        throw new Error(msg);
      }

      // 1. Xin presigned upload URL từ backend
      const presigned = await ticketApi.generateAttachmentUploadUrl(ticketId, {
        fileName: file.name,
        fileSizeBytes: file.size,
        contentType: file.type || 'application/octet-stream',
      });

      // 2. Tải tệp trực tiếp lên MinIO/S3 storage qua pre-signed URL
      await ticketApi.uploadFileToPresignedUrl(presigned.uploadUrl, file);

      return {
        storageKey: presigned.storageKey,
        fileName: file.name,
        fileSizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      };
    },
    retry: false,
  });

  const downloadAttachment = async (storageKey: string, fileName?: string) => {
    const res = await ticketApi.getAttachmentDownloadUrl(ticketId, storageKey);
    const link = document.createElement('a');
    link.href = res.downloadUrl;
    link.download = fileName || storageKey.split('/').pop() || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    uploadFile: mutation.mutateAsync,
    isUploading: mutation.isPending,
    uploadError: validationError || (mutation.error ? (mutation.error as Error).message : null),
    downloadAttachment,
  };
}
