import { apiClient } from '@/shared/api/apiClient';
import type {
  CreateServiceCategoryPayload,
  ServiceCategoryItemDto,
  UpdateServiceCategoryPayload,
} from '../model/serviceCatalog.types';
import { readServiceCategories, readServiceCategory } from './serviceCatalogContract';

export const serviceCatalogApi = {
  async getCategories(signal?: AbortSignal): Promise<ServiceCategoryItemDto[]> {
    const response = await apiClient.get<unknown>('/service-catalog/categories', { signal });
    return readServiceCategories(response.data);
  },

  async getCategoryById(id: string, signal?: AbortSignal): Promise<ServiceCategoryItemDto> {
    const response = await apiClient.get<unknown>(`/service-catalog/categories/${encodeURIComponent(id)}`, { signal });
    return readServiceCategory(response.data);
  },

  async createCategory(payload: CreateServiceCategoryPayload): Promise<ServiceCategoryItemDto> {
    const response = await apiClient.post<unknown>('/service-catalog/categories', payload);
    return readServiceCategory(response.data);
  },

  async updateCategory(id: string, payload: UpdateServiceCategoryPayload): Promise<ServiceCategoryItemDto> {
    const response = await apiClient.put<unknown>(`/service-catalog/categories/${encodeURIComponent(id)}`, payload);
    return readServiceCategory(response.data);
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/service-catalog/categories/${encodeURIComponent(id)}`);
  },
};
