import { apiClient } from '@/shared/api/apiClient';
import { uploadToPresignedUrl } from '@/shared/api/uploadClient';
import type {
  AddCommentPayload,
  AddInternalNotePayload,
  CreateTicketPayload,
  GenerateUploadUrlPayload,
} from '../model/ticket.types';
import {
  readDownloadUrlResult,
  readTicket,
  readTicketPage,
  readTimeline,
  readTimelineItem,
  readUploadUrlResult,
} from './ticketContract';

/** Only endpoints implemented at the pinned backend baseline are callable. */
export const ticketApi = {
  async getMyTickets(page = 1, pageSize = 10, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/tickets/me', { params: { page, pageSize }, signal });
    return readTicketPage(response.data);
  },
  async getTicketById(id: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(`/tickets/${encodeURIComponent(id)}`, { signal });
    return readTicket(response.data);
  },
  async createTicket(payload: CreateTicketPayload) {
    const response = await apiClient.post<unknown>('/tickets', payload);
    return readTicket(response.data);
  },
  async claimTicket(ticketId: string) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/claim`);
    return readTicket(response.data);
  },
  async resolveTicket(ticketId: string) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/resolve`);
    return readTicket(response.data);
  },
  async closeTicket(ticketId: string) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/close`);
    return readTicket(response.data);
  },
  async reopenTicket(ticketId: string) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/reopen`);
    return readTicket(response.data);
  },
  async cancelTicket(ticketId: string) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/cancel`);
    return readTicket(response.data);
  },
  async getTicketTimeline(ticketId: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(`/tickets/${encodeURIComponent(ticketId)}/timeline`, { signal });
    return readTimeline(response.data);
  },
  async addComment(payload: AddCommentPayload) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(payload.ticketId)}/comments`, {
      content: payload.content,
    });
    return readTimelineItem(response.data);
  },
  async addInternalNote(payload: AddInternalNotePayload) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(payload.ticketId)}/internal-notes`, {
      content: payload.content,
    });
    return readTimelineItem(response.data);
  },
  async generateAttachmentUploadUrl(ticketId: string, payload: GenerateUploadUrlPayload) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/attachments/upload-url`, payload);
    return readUploadUrlResult(response.data);
  },
  async getAttachmentDownloadUrl(ticketId: string, storageKey: string) {
    const response = await apiClient.get<unknown>(
      `/tickets/${encodeURIComponent(ticketId)}/attachments/download-url`,
      { params: { storageKey } },
    );
    return readDownloadUrlResult(response.data);
  },
  async uploadFileToPresignedUrl(uploadUrl: string, file: File) {
    await uploadToPresignedUrl(uploadUrl, file, file.type || 'application/octet-stream');
  },
};
