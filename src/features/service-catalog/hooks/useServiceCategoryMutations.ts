import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { serviceCatalogApi } from '../api/serviceCatalogApi';
import { invalidateServiceCatalogQueries, serviceCatalogInvalidation } from '../api/serviceCatalogQueries';
import type { CreateServiceCategoryPayload, UpdateServiceCategoryPayload } from '../model/serviceCatalog.types';

export function useCreateServiceCategory() {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateServiceCategoryPayload) => serviceCatalogApi.createCategory(payload),
    onSuccess: () => {
      void invalidateServiceCatalogQueries(queryClient, serviceCatalogInvalidation.list(sessionVersion));
    },
  });
}

export function useUpdateServiceCategory(id: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateServiceCategoryPayload) => serviceCatalogApi.updateCategory(id, payload),
    onSuccess: () => {
      void invalidateServiceCatalogQueries(queryClient, serviceCatalogInvalidation.detail(sessionVersion, id));
    },
  });
}

export function useDeleteServiceCategory() {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceCatalogApi.deleteCategory(id),
    onSuccess: () => {
      void invalidateServiceCatalogQueries(queryClient, serviceCatalogInvalidation.list(sessionVersion));
    },
  });
}
