export interface DepartmentItemDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  managerId?: string | null;
  managerName?: string | null;
  employeeCount?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  description?: string | null;
  managerId?: string | null;
}

export interface UpdateDepartmentPayload {
  name: string;
  description?: string | null;
  managerId?: string | null;
  status?: 'active' | 'inactive';
}
