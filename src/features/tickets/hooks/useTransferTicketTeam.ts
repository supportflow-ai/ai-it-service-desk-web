import { ticketApi } from '../api/ticketApi';
import type { TransferTicketTeamPayload } from '../model/ticket.types';
import { useTicketWrite } from './useTicketWrite';

export function useTransferTicketTeam(ticketId: string) {
  return useTicketWrite({
    ticketId,
    action: 'transfer-team',
    write: (payload: TransferTicketTeamPayload) => ticketApi.transferTeam(ticketId, payload),
    change: 'state',
  });
}
