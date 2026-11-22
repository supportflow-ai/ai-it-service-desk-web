import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { departmentApi } from '../api/departmentApi';
import { departmentKeys } from '../api/departmentQueries';

export function useDepartmentsList() {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: departmentKeys.list(sessionVersion),
    queryFn: ({ signal }) => departmentApi.getDepartments(signal),
    enabled: status === 'authenticated',
  });
}
