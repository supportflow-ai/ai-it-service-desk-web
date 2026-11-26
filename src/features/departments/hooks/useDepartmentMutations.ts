import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { departmentApi } from '../api/departmentApi';
import { departmentInvalidation, invalidateDepartmentQueries } from '../api/departmentQueries';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from '../model/department.types';

export function useCreateDepartment() {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => departmentApi.createDepartment(payload),
    onSuccess: () => {
      void invalidateDepartmentQueries(queryClient, departmentInvalidation.departments(sessionVersion));
    },
  });
}

export function useUpdateDepartment(id: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) => departmentApi.updateDepartment(id, payload),
    onSuccess: () => {
      void invalidateDepartmentQueries(queryClient, departmentInvalidation.departmentDetail(sessionVersion, id));
    },
  });
}

export function useDeleteDepartment() {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentApi.deleteDepartment(id),
    onSuccess: () => {
      void invalidateDepartmentQueries(queryClient, departmentInvalidation.departments(sessionVersion));
    },
  });
}
