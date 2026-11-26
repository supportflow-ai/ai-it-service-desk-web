import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { serviceCatalogApi } from '../api/serviceCatalogApi';
import { serviceCatalogKeys } from '../api/serviceCatalogQueries';

export function useServiceCategories() {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: serviceCatalogKeys.list(sessionVersion),
    queryFn: ({ signal }) => serviceCatalogApi.getCategories(signal),
    enabled: status === 'authenticated',
  });
}
