import { describe, expect, it } from 'vitest';
import type { User } from '@/features/auth';
import { canManageServiceCatalog } from './serviceCatalogPermissions';

function userWith(roles: User['roles']): User {
  return { userId: 'u1', email: 'test@example.com', fullName: null, roles };
}

describe('serviceCatalogPermissions', () => {
  it('allows Admin to manage service catalog', () => {
    expect(canManageServiceCatalog(userWith(['Admin']))).toBe(true);
  });

  it('forbids Agent, Requester, or anonymous users', () => {
    expect(canManageServiceCatalog(userWith(['Agent']))).toBe(false);
    expect(canManageServiceCatalog(userWith(['Requester']))).toBe(false);
    expect(canManageServiceCatalog(null)).toBe(false);
  });
});
