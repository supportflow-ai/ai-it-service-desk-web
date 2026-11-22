import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import type { DepartmentItemDto } from '../model/department.types';

function isDepartment(value: unknown): value is DepartmentItemDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && (value.description === null || typeof value.description === 'string')
    && (value.managerId === undefined || value.managerId === null || typeof value.managerId === 'string')
    && (value.managerName === undefined || value.managerName === null || typeof value.managerName === 'string')
    && (value.employeeCount === undefined || typeof value.employeeCount === 'number')
    && (value.status === undefined || value.status === 'active' || value.status === 'inactive')
    && (value.createdAt === undefined || typeof value.createdAt === 'string');
}

export function readDepartment(value: unknown): DepartmentItemDto {
  if (!isDepartment(value)) {
    throw new AppError('Phản hồi thông tin phòng ban không hợp lệ.', 'invalid-response');
  }
  return value;
}

export function readDepartments(value: unknown): DepartmentItemDto[] {
  if (!Array.isArray(value) || !value.every(isDepartment)) {
    throw new AppError('Phản hồi danh sách phòng ban không hợp lệ.', 'invalid-response');
  }
  return value;
}
