import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';

export function useAgents() {
  const { sessionVersion, status, user } = useAuth();
  return useQuery({
    queryKey: ticketKeys.agents(sessionVersion),
    queryFn: ({ signal }) => ticketApi.getAgents(signal),
    enabled: status === 'authenticated' && !!user?.roles.some((role) => role === 'Agent' || role === 'Admin'),
  });
}
