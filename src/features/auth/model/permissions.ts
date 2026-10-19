import type { Role } from './auth.types';

export function hasAnyRole(roles: readonly string[], allowedRoles: readonly Role[]) {
  return allowedRoles.some((role) => roles.includes(role));
}
