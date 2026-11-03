import { AppError } from '@/shared/api/httpError';
import { apiClient } from '@/shared/api/apiClient';
import { uploadToPresignedUrl } from '@/shared/api/uploadClient';
import type { PresignedUploadOptions } from '@/shared/api/uploadClient';
import type {
  AddCommentPayload,
  AddInternalNotePayload,
  AgentQueueFilters,
  CreateTicketPayload,
  ConfirmAttachmentPayload,
  GenerateUploadUrlPayload,
} from '../model/ticket.types';
import {
  readDownloadUrlResult,
  readAttachment,
  readAgents,
  readAttachments,
  readTicket,
  readTicketPage,
  readTimeline,
  readTimelineItem,
  readUploadUrlResult,
} from './ticketContract';

function agentQueueParams({ scope, status, category, page, pageSize }: AgentQueueFilters) {
  return {
    page,
    pageSize,
    ...(scope === 'all' ? {} : { scope }),
    ...(status === null ? {} : { status }),
    ...(category === null ? {} : { category }),
  };
}

function requireRevision(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value) || value <= 0 || value > 4294967295) {
    throw new AppError('Cần tải lại ticket để lấy phiên bản hiện tại trước khi thao tác.', 'invalid-response');
  }
  return value;
}

/** Only endpoints implemented at the pinned backend baseline are callable. */
export const ticketApi = {
  async getAgents(signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/users', { params: { role: 'Agent' }, signal });
    return readAgents(response.data);
  },
  async getMyTickets(page = 1, pageSize = 10, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/tickets/me', { params: { page, pageSize }, signal });
    return readTicketPage(response.data);
  },
  async getAgentQueue(filters: AgentQueueFilters, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/tickets/queue', { params: agentQueueParams(filters), signal });
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
  async assignTicket(ticketId: string, agentId: string, expectedRevision?: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/assign`, { agentId, expectedRevision: requireRevision(expectedRevision) });
    return readTicket(response.data);
  },
  async unassignTicket(ticketId: string, expectedRevision?: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/unassign`, undefined, { params: { expectedRevision: requireRevision(expectedRevision) } });
    return readTicket(response.data);
  },
  async claimTicket(ticketId: string, expectedRevision?: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/claim`, undefined, { params: { expectedRevision: requireRevision(expectedRevision) } });
    return readTicket(response.data);
  },
  async resolveTicket(ticketId: string, expectedRevision?: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/resolve`, undefined, { params: { expectedRevision: requireRevision(expectedRevision) } });
    return readTicket(response.data);
  },
  async closeTicket(ticketId: string, expectedRevision?: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/close`, undefined, { params: { expectedRevision: requireRevision(expectedRevision) } });
    return readTicket(response.data);
  },
  async reopenTicket(ticketId: string, expectedRevision?: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/reopen`, undefined, { params: { expectedRevision: requireRevision(expectedRevision) } });
    return readTicket(response.data);
  },
  async cancelTicket(ticketId: string, expectedRevision?: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/cancel`, undefined, { params: { expectedRevision: requireRevision(expectedRevision) } });
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
  async getAttachments(ticketId: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(`/tickets/${encodeURIComponent(ticketId)}/attachments`, { signal });
    return readAttachments(response.data);
  },
  async confirmAttachment(ticketId: string, payload: ConfirmAttachmentPayload) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/attachments/confirm`, payload);
    return readAttachment(response.data);
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
  async uploadFileToPresignedUrl(uploadUrl: string, file: File, options: Omit<PresignedUploadOptions, 'contentType'> = {}) {
    await uploadToPresignedUrl(uploadUrl, file, { ...options, contentType: file.type || 'application/octet-stream' });
  },
};
