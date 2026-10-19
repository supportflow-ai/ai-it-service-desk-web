import { useAuth } from '@/features/auth';
import { canOpenWorkspace, ticketCapabilities } from '../model/ticketPermissions';

export function useTicketCommands(ticketId: string) {
  const { user } = useAuth();
  return { ticketId, eligible: canOpenWorkspace(user), capabilities: ticketCapabilities };
}
