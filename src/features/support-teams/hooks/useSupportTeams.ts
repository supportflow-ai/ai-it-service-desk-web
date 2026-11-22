import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supportTeamApi } from '../api/supportTeamApi';
import { supportTeamKeys } from '../api/supportTeamQueries';

export function useSupportTeams() {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: supportTeamKeys.list(sessionVersion),
    queryFn: ({ signal }) => supportTeamApi.getTeams(signal),
    enabled: status === 'authenticated',
  });
}
