import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';

export function canManageServiceCatalog(user: User | null): boolean {
  return !!user && hasAnyRole(user.roles, ['Admin']);
}
