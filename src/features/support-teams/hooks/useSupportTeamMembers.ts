import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supportTeamApi } from '../api/supportTeamApi';
import { supportTeamKeys } from '../api/supportTeamQueries';

export function useSupportTeamMembers(teamId: string | null | undefined) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: supportTeamKeys.members(sessionVersion, teamId ?? ''),
    queryFn: ({ signal }) => (teamId ? supportTeamApi.getTeamMembers(teamId, signal) : Promise.resolve([])),
    enabled: status === 'authenticated' && Boolean(teamId),
  });
}
