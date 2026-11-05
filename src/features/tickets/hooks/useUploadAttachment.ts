import { useState } from 'react';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { confirmUploadedAttachment, isRetryableConfirmError, uploadAttachment } from '../lib/uploadAttachment';
import type { UnconfirmedUpload } from '../lib/uploadAttachment';
import { validateAttachmentFile } from '../validation/attachmentRules';
import { useTicketWrite } from './useTicketWrite';

/**
 * A file belongs to the ticket only once the backend confirms it, so the upload is not done
 * until step 3 succeeds; the attachment list is then refreshed from the server.
 *
 * When only the confirmation fails for a reason that may pass, the file is already in storage:
 * it is kept as `unconfirmed` so the person can confirm it again without sending it a second time.
 */
export function useUploadAttachment(ticketId: string) {
  const { sessionVersion } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [unconfirmed, setUnconfirmed] = useState<UnconfirmedUpload | null>(null);

  const assertSameSession = () => {
    if (sessionStore.getSnapshot().version !== sessionVersion) {
      throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
    }
  };

  const mutation = useTicketWrite({
    ticketId,
    action: 'upload',
    change: 'attachments',
    write: async (file: File) => {
      let reached: UnconfirmedUpload | null = null;
      try {
        const attachment = await uploadAttachment(ticketId, file, {
          onProgress: setProgress,
          checkpoint: assertSameSession,
          onUploaded: (upload) => { reached = upload; },
        });
        setUnconfirmed(null);
        return attachment;
      } catch (error) {
        setUnconfirmed(reached && isRetryableConfirmError(error) ? reached : null);
        throw error;
      }
    },
  });

  const confirmAgain = useTicketWrite({
    ticketId,
    action: 'confirm',
    change: 'attachments',
    write: async (upload: UnconfirmedUpload) => {
      try {
        const attachment = await confirmUploadedAttachment(ticketId, upload);
        setUnconfirmed(null);
        return attachment;
      } catch (error) {
        if (!isRetryableConfirmError(error)) setUnconfirmed(null);
        throw error;
      }
    },
  });

  /** Validates locally first, so a rejected file never reaches the API. */
  const upload = (file: File) => {
    mutation.reset();
    confirmAgain.reset();
    setUnconfirmed(null);
    const invalid = validateAttachmentFile(file);
    setValidationError(invalid);
    if (invalid) return;
    setProgress(0);
    mutation.mutate(file);
  };

  const retryConfirm = () => {
    if (!unconfirmed) return;
    mutation.reset();
    confirmAgain.reset();
    confirmAgain.mutate(unconfirmed);
  };

  const clearError = () => {
    setValidationError(null);
    mutation.reset();
    confirmAgain.reset();
  };

  /** Gives up on confirming: the file stays in storage unattached, and the person may pick it again. */
  const discardUnconfirmed = () => {
    clearError();
    setUnconfirmed(null);
  };

  return {
    upload,
    progress,
    isUploading: mutation.isPending,
    uploadingFileName: mutation.isPending ? mutation.variables.name : null,
    validationError,
    error: confirmAgain.error ?? mutation.error,
    unconfirmed: unconfirmed ? { fileName: unconfirmed.metadata.fileName } : null,
    isConfirming: confirmAgain.isPending,
    retryConfirm,
    discardUnconfirmed,
    clearError,
  };
}
