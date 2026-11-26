import { describe, expect, it } from 'vitest';
import type { User } from '@/features/auth';
import { canManageDepartments } from './departmentPermissions';

function userWith(roles: User['roles']): User {
  return { userId: 'u1', email: 'test@example.com', fullName: null, roles };
}

describe('departmentPermissions', () => {
  it('allows Admin to manage departments', () => {
    expect(canManageDepartments(userWith(['Admin']))).toBe(true);
  });

  it('forbids Agent, Requester, or anonymous users', () => {
    expect(canManageDepartments(userWith(['Agent']))).toBe(false);
    expect(canManageDepartments(userWith(['Requester']))).toBe(false);
    expect(canManageDepartments(null)).toBe(false);
  });
});
