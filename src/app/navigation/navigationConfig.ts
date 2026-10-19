import { hasAnyRole } from '@/features/auth';
import { routeConfig } from '../router/routeConfig';

export function getNavigation(roles: readonly string[]) {
  return Object.values(routeConfig).flatMap((route) =>
    'label' in route && hasAnyRole(roles, route.roles) ? [{ key: route.path, label: route.label }] : []);
}
