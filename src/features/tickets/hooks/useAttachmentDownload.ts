import { useMutation } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { ticketApi } from '../api/ticketApi';
import { openDownloadUrl } from '../lib/openDownloadUrl';

interface DownloadRequest {
  storageKey: string;
  fileName: string;
}

export function useAttachmentDownload(ticketId: string) {
  const { sessionVersion } = useAuth();
  const mutation = useMutation({
    mutationKey: ['tickets', sessionVersion, 'download-attachment', ticketId],
    mutationFn: async ({ storageKey }: DownloadRequest) => {
      const result = await ticketApi.getAttachmentDownloadUrl(ticketId, storageKey);
      if (sessionStore.getSnapshot().version !== sessionVersion) {
        throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      }
      return result;
    },
    retry: false,
    onSuccess: (result, { fileName }) => openDownloadUrl(result.downloadUrl, fileName),
  });

  return {
    download: (request: DownloadRequest) => mutation.mutate(request),
    downloadingKey: mutation.isPending ? mutation.variables.storageKey : null,
    error: mutation.error,
    clearError: mutation.reset,
  };
}
