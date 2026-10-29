import { apiClient } from '@/shared/api/apiClient';
import type { AddCommentPayload, AddInternalNotePayload, CreateTicketPayload } from '../model/ticket.types';
import { readTicket, readTicketPage, readTimeline, readTimelineItem } from './ticketContract';

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
};
