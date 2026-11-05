import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import { TicketCategory, TicketPriority, TicketStatus } from '../model/ticket.types';
import type {
  AgentDirectoryEntry,
  DownloadUrlResult,
  PagedTicketResult,
  TicketAttachmentDto,
  TicketDto,
  TimelineItemDto,
  UploadUrlResult,
} from '../model/ticket.types';

function isTicket(value: unknown): value is TicketDto {
  return isRecord(value) && typeof value.id === 'string' && typeof value.ticketNumber === 'string'
    && typeof value.title === 'string' && typeof value.description === 'string'
    && typeof value.createdAt === 'string'
    && Object.values(TicketCategory).some((category) => category === value.categoryId)
    && Object.values(TicketStatus).some((status) => typeof status === 'number' && status === value.status)
    && (value.requesterDepartmentId === undefined || value.requesterDepartmentId === null || typeof value.requesterDepartmentId === 'string')
    && typeof value.requesterId === 'string'
    && (value.assignedToId === null || typeof value.assignedToId === 'string')
    && typeof value.revision === 'number' && Number.isInteger(value.revision) && value.revision >= 0
    && (value.priority === undefined || value.priority === null
      || Object.values(TicketPriority).some((priority) => priority === value.priority));
}

export function readTicket(value: unknown): TicketDto {
  if (!isTicket(value)) throw new AppError('Phản hồi ticket không hợp lệ.', 'invalid-response');
  return value;
}

export function readTicketPage(value: unknown): PagedTicketResult {
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.every(isTicket)
    || typeof value.page !== 'number' || !Number.isInteger(value.page) || value.page < 1
    || typeof value.pageSize !== 'number' || !Number.isInteger(value.pageSize) || value.pageSize < 1
    || typeof value.totalCount !== 'number' || !Number.isInteger(value.totalCount) || value.totalCount < 0) {
    throw new AppError('Phản hồi danh sách ticket không hợp lệ.', 'invalid-response');
  }
  return { items: value.items, page: value.page, pageSize: value.pageSize, totalCount: value.totalCount };
}

function isTimelineItem(value: unknown): value is TimelineItemDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.ticketId === 'string'
    && typeof value.authorId === 'string'
    && typeof value.authorName === 'string'
    && typeof value.authorRole === 'string'
    && typeof value.content === 'string'
    && typeof value.isInternal === 'boolean'
    && typeof value.createdAt === 'string';
}

export function readTimelineItem(value: unknown): TimelineItemDto {
  if (!isTimelineItem(value)) throw new AppError('Phản hồi timeline không hợp lệ.', 'invalid-response');
  return value;
}

export function readTimeline(value: unknown): TimelineItemDto[] {
  if (!Array.isArray(value) || !value.every(isTimelineItem)) {
    throw new AppError('Phản hồi danh sách timeline không hợp lệ.', 'invalid-response');
  }
  return value;
}

// Presigned URLs are navigated to or written to directly, so only absolute http(s) URLs are accepted.
function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function isUploadUrlResult(value: unknown): value is UploadUrlResult {
  return isRecord(value)
    && isHttpUrl(value.uploadUrl)
    && typeof value.storageKey === 'string' && value.storageKey.length > 0
    && typeof value.expirySeconds === 'number'
    && (value.formData === undefined || value.formData === null
      || (isRecord(value.formData) && Object.values(value.formData).every((field) => typeof field === 'string')));
}

export function readUploadUrlResult(value: unknown): UploadUrlResult {
  if (!isUploadUrlResult(value)) throw new AppError('Phản hồi upload URL không hợp lệ.', 'invalid-response');
  return value;
}

function isAttachment(value: unknown): value is TicketAttachmentDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.ticketId === 'string'
    && typeof value.fileName === 'string'
    && typeof value.fileSizeBytes === 'number'
    && typeof value.contentType === 'string'
    && typeof value.storageKey === 'string' && value.storageKey.length > 0
    && typeof value.uploadedBy === 'string'
    && typeof value.createdAt === 'string';
}

export function readAttachment(value: unknown): TicketAttachmentDto {
  if (!isAttachment(value)) throw new AppError('Phản hồi tệp đính kèm không hợp lệ.', 'invalid-response');
  return value;
}

export function readAttachments(value: unknown): TicketAttachmentDto[] {
  if (!Array.isArray(value) || !value.every(isAttachment)) {
    throw new AppError('Phản hồi danh sách tệp đính kèm không hợp lệ.', 'invalid-response');
  }
  return value;
}

function isDownloadUrlResult(value: unknown): value is DownloadUrlResult {
  return isRecord(value) && isHttpUrl(value.downloadUrl);
}

export function readDownloadUrlResult(value: unknown): DownloadUrlResult {
  if (!isDownloadUrlResult(value)) throw new AppError('Phản hồi download URL không hợp lệ.', 'invalid-response');
  return value;
}

// No email is sent, so the name is the only thing a person can be recognized by.
function isAgentDirectoryEntry(value: unknown): value is AgentDirectoryEntry {
  return isRecord(value)
    && typeof value.userId === 'string' && value.userId.length > 0
    && (value.fullName === undefined || value.fullName === null || typeof value.fullName === 'string');
}

export function readAgentDirectory(value: unknown): AgentDirectoryEntry[] {
  if (!Array.isArray(value) || !value.every(isAgentDirectoryEntry)) {
    throw new AppError('Phản hồi danh sách kỹ thuật viên không hợp lệ.', 'invalid-response');
  }
  return value.map(({ userId, fullName }) => ({ userId, fullName: fullName?.trim() || null }));
}
