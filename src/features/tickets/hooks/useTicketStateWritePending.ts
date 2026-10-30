import { useIsMutating } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketKeys } from '../api/ticketQueries';

/** True while any status or assignment write for this ticket is in flight, from any panel. */
export function useTicketStateWritePending(ticketId: string) {
  const { sessionVersion } = useAuth();
  return useIsMutating({ mutationKey: ticketKeys.stateWrites(sessionVersion, ticketId) }) > 0;
}
