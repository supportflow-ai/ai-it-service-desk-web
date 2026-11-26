import type { TicketCategory } from '@/features/tickets';

export interface SupportTeamMemberDto {
  userId: string;
  fullName: string | null;
  role: 'Lead' | 'Agent';
  joinedAt: string;
}

export interface SupportTeamDto {
  id: string;
  code: string;
  name: string;
  description: string;
  leadId: string | null;
  leadName: string | null;
  categories: TicketCategory[];
  memberCount: number;
  activeTicketCount?: number;
  isDefaultTriage: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  members?: SupportTeamMemberDto[];
}

export interface CreateSupportTeamPayload {
  name: string;
  code: string;
  description: string;
  leadId?: string | null;
  categories: TicketCategory[];
}

export interface UpdateSupportTeamPayload {
  name: string;
  description: string;
  leadId?: string | null;
  categories: TicketCategory[];
  status: 'active' | 'inactive';
}

export interface AddTeamMemberPayload {
  userId: string;
  role: 'Lead' | 'Agent';
}
