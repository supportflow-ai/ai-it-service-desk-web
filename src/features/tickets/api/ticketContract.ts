import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import { TicketCategory, TicketStatus } from '../model/ticket.types';
import type { PagedTicketResult, TicketDto, TimelineItemDto } from '../model/ticket.types';

function isTicket(value: unknown): value is TicketDto {
  return isRecord(value) && typeof value.id === 'string' && typeof value.ticketNumber === 'string'
    && typeof value.title === 'string' && typeof value.description === 'string'
    && typeof value.createdAt === 'string'
    && Object.values(TicketCategory).some((category) => category === value.categoryId)
    && Object.values(TicketStatus).some((status) => typeof status === 'number' && status === value.status)
    && (value.requesterDepartmentId === undefined || value.requesterDepartmentId === null || typeof value.requesterDepartmentId === 'string');
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
