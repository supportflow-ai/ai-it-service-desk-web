import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { ticketApi } from '../api/ticketApi';
import { ticketKeys } from '../api/ticketQueries';

export function useTickets(page: number, pageSize: number) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: ticketKeys.list(sessionVersion, page, pageSize),
    queryFn: ({ signal }) => ticketApi.getMyTickets(page, pageSize, signal),
    enabled: status === 'authenticated',
  });
}
