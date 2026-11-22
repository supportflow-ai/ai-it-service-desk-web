import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const departmentKeys = {
  all: (version: number) => ['departments', version] as const,
  list: (version: number) => ['departments', version, 'list'] as const,
  detail: (version: number, id: string) => ['departments', version, 'detail', id] as const,
};

export const departmentInvalidation = {
  departments: (version: number): QueryKey[] => [
    departmentKeys.list(version),
    ['auth', version, 'departments'],
  ],
  departmentDetail: (version: number, id: string): QueryKey[] => [
    departmentKeys.detail(version, id),
    departmentKeys.list(version),
    ['auth', version, 'departments'],
  ],
};

export async function invalidateDepartmentQueries(queryClient: QueryClient, keys: QueryKey[]) {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
