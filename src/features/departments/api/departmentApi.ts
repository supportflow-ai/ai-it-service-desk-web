import { apiClient } from '@/shared/api/apiClient';
import type {
  CreateDepartmentPayload,
  DepartmentItemDto,
  UpdateDepartmentPayload,
} from '../model/department.types';
import { readDepartment, readDepartments } from './departmentContract';

export const departmentApi = {
  async getDepartments(signal?: AbortSignal): Promise<DepartmentItemDto[]> {
    const response = await apiClient.get<unknown>('/departments', { signal });
    return readDepartments(response.data);
  },

  async getDepartmentById(id: string, signal?: AbortSignal): Promise<DepartmentItemDto> {
    const response = await apiClient.get<unknown>(`/departments/${encodeURIComponent(id)}`, { signal });
    return readDepartment(response.data);
  },

  async createDepartment(payload: CreateDepartmentPayload): Promise<DepartmentItemDto> {
    const response = await apiClient.post<unknown>('/departments', payload);
    return readDepartment(response.data);
  },

  async updateDepartment(id: string, payload: UpdateDepartmentPayload): Promise<DepartmentItemDto> {
    const response = await apiClient.put<unknown>(`/departments/${encodeURIComponent(id)}`, payload);
    return readDepartment(response.data);
  },

  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(`/departments/${encodeURIComponent(id)}`);
  },
};
