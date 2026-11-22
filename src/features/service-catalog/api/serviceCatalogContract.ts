import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import type { ServiceCategoryItemDto } from '../model/serviceCatalog.types';

function isServiceCategory(value: unknown): value is ServiceCategoryItemDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && (value.targetTeamId === null || typeof value.targetTeamId === 'string')
    && (value.targetTeamName === null || typeof value.targetTeamName === 'string')
    && (value.defaultPriority === 'P1' || value.defaultPriority === 'P2' || value.defaultPriority === 'P3' || value.defaultPriority === 'P4')
    && typeof value.targetResolutionHours === 'number'
    && (value.status === 'active' || value.status === 'inactive')
    && (value.ticketCount === undefined || typeof value.ticketCount === 'number')
    && (value.createdAt === undefined || typeof value.createdAt === 'string');
}

export function readServiceCategory(value: unknown): ServiceCategoryItemDto {
  if (!isServiceCategory(value)) {
    throw new AppError('Phản hồi danh mục dịch vụ không hợp lệ.', 'invalid-response');
  }
  return value;
}

export function readServiceCategories(value: unknown): ServiceCategoryItemDto[] {
  if (!Array.isArray(value) || !value.every(isServiceCategory)) {
    throw new AppError('Phản hồi danh sách danh mục dịch vụ không hợp lệ.', 'invalid-response');
  }
  return value;
}
