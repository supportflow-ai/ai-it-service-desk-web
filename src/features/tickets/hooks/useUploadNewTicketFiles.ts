import { useState } from 'react';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError, normalizeError } from '@/shared/api/httpError';
import { uploadAttachment } from '../lib/uploadAttachment';

export interface NewTicketUploadProgress {
  current: number;
  total: number;
  fileName: string;
  percent: number;
}

/**
 * Attaches the files chosen on the create screen to the ticket just created, one after another.
 * A failed file does not stop the others; their names are returned. A session change stops all.
 */
export function useUploadNewTicketFiles() {
  const { sessionVersion } = useAuth();
  const [progress, setProgress] = useState<NewTicketUploadProgress | null>(null);

  const checkpoint = () => {
    if (sessionStore.getSnapshot().version !== sessionVersion) {
      throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
    }
  };

  const uploadAll = async (ticketId: string, files: readonly File[]) => {
    const failed: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setProgress({ current: index + 1, total: files.length, fileName: file.name, percent: 0 });
        try {
          await uploadAttachment(ticketId, file, {
            checkpoint,
            onProgress: (percent) => setProgress((value) => value && { ...value, percent }),
          });
        } catch (error) {
          if (normalizeError(error).kind === 'canceled') throw error;
          failed.push(file.name);
        }
      }
    } finally {
      setProgress(null);
    }
    return failed;
  };

  return { uploadAll, progress };
}
