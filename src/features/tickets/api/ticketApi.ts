import { apiClient } from '@/shared/api/apiClient';
import { uploadToPresignedUrl } from '@/shared/api/uploadClient';
import type { PresignedUploadOptions } from '@/shared/api/uploadClient';
import type {
  AddCommentPayload,
  AddInternalNotePayload,
  AgentQueueFilters,
  ConfirmAttachmentPayload,
  CreateTicketPayload,
  GenerateUploadUrlPayload,
} from '../model/ticket.types';
import {
  readAgentDirectory,
  readAttachment,
  readAttachments,
  readDownloadUrlResult,
  readTicket,
  readTicketPage,
  readTimeline,
  readTimelineItem,
  readUploadUrlResult,
} from './ticketContract';

function agentQueueParams({ scope, status, category, priority, sortByPriority, page, pageSize }: AgentQueueFilters) {
  return {
    page,
    pageSize,
    ...(scope === 'all' ? {} : { scope }),
    ...(status === null ? {} : { status }),
    ...(category === null ? {} : { category }),
    ...(priority === null ? {} : { priority }),
    ...(sortByPriority ? { sortByPriority: true } : {}),
  };
}

/** Only endpoints implemented at the pinned backend baseline are callable. */
export const ticketApi = {
  async getMyTickets(page = 1, pageSize = 10, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/tickets/me', { params: { page, pageSize }, signal });
    return readTicketPage(response.data);
  },
  async getAgentQueue(filters: AgentQueueFilters, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/tickets/queue', { params: agentQueueParams(filters), signal });
    return readTicketPage(response.data);
  },
  /** Staff only (403 for a requester): the agents a ticket can be assigned to. */
  async getAgentDirectory(signal?: AbortSignal) {
    const response = await apiClient.get<unknown>('/users', { params: { role: 'Agent' }, signal });
    return readAgentDirectory(response.data);
  },
  async getTicketById(id: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(`/tickets/${encodeURIComponent(id)}`, { signal });
    return readTicket(response.data);
  },
  async createTicket(payload: CreateTicketPayload) {
    const response = await apiClient.post<unknown>('/tickets', payload);
    return readTicket(response.data);
  },
  // State commands carry the revision the user acted on; the server answers 409 if it is outdated.
  async assignTicket(ticketId: string, agentId: string, expectedRevision: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/assign`, { agentId, expectedRevision });
    return readTicket(response.data);
  },
  async unassignTicket(ticketId: string, expectedRevision: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/unassign`, undefined, { params: { expectedRevision } });
    return readTicket(response.data);
  },
  async claimTicket(ticketId: string, expectedRevision: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/claim`, undefined, { params: { expectedRevision } });
    return readTicket(response.data);
  },
  async resolveTicket(ticketId: string, expectedRevision: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/resolve`, undefined, { params: { expectedRevision } });
    return readTicket(response.data);
  },
  async closeTicket(ticketId: string, expectedRevision: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/close`, undefined, { params: { expectedRevision } });
    return readTicket(response.data);
  },
  async reopenTicket(ticketId: string, expectedRevision: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/reopen`, undefined, { params: { expectedRevision } });
    return readTicket(response.data);
  },
  async cancelTicket(ticketId: string, expectedRevision: number) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/cancel`, undefined, { params: { expectedRevision } });
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
  async confirmAttachmentUpload(ticketId: string, payload: ConfirmAttachmentPayload) {
    const response = await apiClient.post<unknown>(`/tickets/${encodeURIComponent(ticketId)}/attachments/confirm`, payload);
    return readAttachment(response.data);
  },
  async getTicketAttachments(ticketId: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(`/tickets/${encodeURIComponent(ticketId)}/attachments`, { signal });
    return readAttachments(response.data);
  },
  async uploadFileToPresignedUrl(uploadUrl: string, file: File, options: Omit<PresignedUploadOptions, 'contentType'> = {}) {
    await uploadToPresignedUrl(uploadUrl, file, { ...options, contentType: file.type || 'application/octet-stream' });
  },
};
