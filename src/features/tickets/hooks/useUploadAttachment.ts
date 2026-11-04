import { useState } from 'react';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { uploadAttachment } from '../lib/uploadAttachment';
import { validateAttachmentFile } from '../validation/attachmentRules';
import { useTicketWrite } from './useTicketWrite';

/**
 * A file belongs to the ticket only once the backend confirms it, so the upload is not done
 * until step 3 succeeds; the attachment list is then refreshed from the server.
 */
export function useUploadAttachment(ticketId: string) {
  const { sessionVersion } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const assertSameSession = () => {
    if (sessionStore.getSnapshot().version !== sessionVersion) {
      throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
    }
  };

  const mutation = useTicketWrite({
    ticketId,
    action: 'upload',
    change: 'attachments',
    write: (file: File) => uploadAttachment(ticketId, file, { onProgress: setProgress, checkpoint: assertSameSession }),
  });

  /** Validates locally first, so a rejected file never reaches the API. */
  const upload = (file: File) => {
    mutation.reset();
    const invalid = validateAttachmentFile(file);
    setValidationError(invalid);
    if (invalid) return;
    setProgress(0);
    mutation.mutate(file);
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
