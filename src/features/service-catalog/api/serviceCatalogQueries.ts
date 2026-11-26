import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const serviceCatalogKeys = {
  all: (version: number) => ['service-catalog', version] as const,
  list: (version: number) => ['service-catalog', version, 'list'] as const,
  detail: (version: number, id: string) => ['service-catalog', version, 'detail', id] as const,
};

export const serviceCatalogInvalidation = {
  list: (version: number): QueryKey[] => [
    serviceCatalogKeys.list(version),
  ],
  detail: (version: number, id: string): QueryKey[] => [
    serviceCatalogKeys.detail(version, id),
    serviceCatalogKeys.list(version),
  ],
};

export async function invalidateServiceCatalogQueries(queryClient: QueryClient, keys: QueryKey[]) {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
