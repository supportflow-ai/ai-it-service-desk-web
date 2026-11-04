import type { TicketPriority } from './ticket.types';

// Meanings follow the backend Priority enum (ServiceDesk.Domain/Ticketing/Priority.cs).
export const ticketPriorityLabels: Record<TicketPriority, string> = {
  P1: 'P1 · Khẩn cấp',
  P2: 'P2 · Cao',
  P3: 'P3 · Trung bình',
  P4: 'P4 · Thấp',
};
