import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { authKeys } from '../api/authQueries';
import { useAuth } from './useAuth';

export function useDepartments() {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: authKeys.departments(sessionVersion),
    queryFn: ({ signal }) => authApi.getDepartments(signal),
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000,
  });
}
