import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { authKeys } from '../api/authQueries';
import { useAuth } from './useAuth';

export function useUsers(role?: string) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: authKeys.users(sessionVersion, role),
    queryFn: ({ signal }) => authApi.getUsers(role, signal),
    enabled: status === 'authenticated',
  });
}
