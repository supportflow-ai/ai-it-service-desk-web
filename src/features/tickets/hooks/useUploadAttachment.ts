import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError } from '@/shared/api/httpError';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import type { ConfirmAttachmentPayload, TicketAttachmentDto } from '../model/ticket.types';
import { validateAttachmentFile } from '../validation/attachmentRules';

type UploadAction = { kind: 'upload'; file: File } | { kind: 'confirm'; request: ConfirmAttachmentPayload };

export function useUploadAttachment(ticketId: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmAttachmentPayload | null>(null);
  const assertSameSession = () => {
    if (sessionStore.getSnapshot().version !== sessionVersion) throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
  };

  const mutation = useMutation({
    mutationKey: ticketKeys.write(sessionVersion, ticketId, 'conversation', 'upload-attachment'),
    mutationFn: async (action: UploadAction): Promise<TicketAttachmentDto> => {
      assertSameSession();
      let request: ConfirmAttachmentPayload;
      if (action.kind === 'confirm') request = action.request;
      else {
        const file = action.file;
        const metadata = { fileName: file.name, fileSizeBytes: file.size, contentType: file.type || 'application/octet-stream' };
        const signed = await ticketApi.generateAttachmentUploadUrl(ticketId, metadata);
        assertSameSession();
        await ticketApi.uploadFileToPresignedUrl(signed.uploadUrl, file, { onProgress: setProgress, formData: signed.formData });
        assertSameSession();
        request = { ...metadata, storageKey: signed.storageKey };
        setPendingConfirmation(request);
      }
      const result = await ticketApi.confirmAttachment(ticketId, request);
      assertSameSession();
      return result;
    },
    retry: false,
    onSuccess: async (result) => {
      if (sessionStore.getSnapshot().version !== sessionVersion) return;
      setPendingConfirmation(null);
      const key = ticketKeys.attachments(sessionVersion, ticketId);
      queryClient.setQueryData<TicketAttachmentDto[]>(key, (current = []) => [result, ...current.filter((item) => item.id !== result.id)]);
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const upload = (file: File) => {
    if (mutation.isPending || pendingConfirmation) return;
    mutation.reset();
    const invalid = validateAttachmentFile(file);
    setValidationError(invalid);
    if (invalid) return;
    setProgress(0);
    mutation.mutate({ kind: 'upload', file });
  };

  return {
    upload, progress, pendingConfirmation,
    retryConfirmation: () => { if (pendingConfirmation && !mutation.isPending) mutation.mutate({ kind: 'confirm', request: pendingConfirmation }); },
    discardConfirmation: () => { if (!mutation.isPending) { setPendingConfirmation(null); mutation.reset(); } },
    isUploading: mutation.isPending,
    uploadingFileName: mutation.variables?.kind === 'upload' ? mutation.variables.file.name : pendingConfirmation?.fileName,
    validationError, error: mutation.error,
    clearError: () => { setValidationError(null); mutation.reset(); },
  };
}
