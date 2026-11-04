import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import { canOpenWorkspace } from '../model/ticketPermissions';

/** Agents a ticket can be assigned to. Only fetched for staff: a requester would get 403. */
export function useAgentDirectory() {
  const { sessionVersion, status, user } = useAuth();
  return useQuery({
    queryKey: ticketKeys.agents(sessionVersion),
    queryFn: ({ signal }) => ticketApi.getAgentDirectory(signal),
    enabled: status === 'authenticated' && canOpenWorkspace(user),
  });
}
