import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';
import { canOpenWorkspace } from '../model/ticketPermissions';
import { useAgentDirectory } from './useAgentDirectory';

/**
 * Agents and Admins, to put a name to whoever holds a ticket: an Admin can take one too (claim).
 * Only fetched for staff, since a requester would get 403. Not the list to assign from: that is
 * `useAgentDirectory`. The agents are shared with it; a failed Admin lookup leaves the agents usable.
 */
export function useStaffDirectory() {
  const { sessionVersion, status, user } = useAuth();
  const agents = useAgentDirectory();
  const admins = useQuery({
    queryKey: ticketKeys.admins(sessionVersion),
    queryFn: ({ signal }) => ticketApi.getAdminDirectory(signal),
    enabled: status === 'authenticated' && canOpenWorkspace(user),
  });
  const data = useMemo(() => {
    if (!agents.data) return undefined;
    // Someone with both roles is listed twice but is one person.
    return [...new Map([...agents.data, ...(admins.data ?? [])].map((entry) => [entry.userId, entry])).values()];
  }, [agents.data, admins.data]);
  return { data, isPending: agents.isPending, error: agents.error };
}
