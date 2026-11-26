export interface ServiceCategoryItemDto {
  id: string;
  code: string;
  name: string;
  description: string;
  targetTeamId: string | null;
  targetTeamName: string | null;
  defaultPriority: 'P1' | 'P2' | 'P3' | 'P4';
  targetResolutionHours: number;
  status: 'active' | 'inactive';
  ticketCount?: number;
  createdAt?: string;
}

export interface CreateServiceCategoryPayload {
  code: string;
  name: string;
  description: string;
  targetTeamId?: string | null;
  defaultPriority?: 'P1' | 'P2' | 'P3' | 'P4';
  targetResolutionHours?: number;
}

export interface UpdateServiceCategoryPayload {
  name: string;
  description: string;
  targetTeamId?: string | null;
  defaultPriority?: 'P1' | 'P2' | 'P3' | 'P4';
  targetResolutionHours?: number;
  status?: 'active' | 'inactive';
}
