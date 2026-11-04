import { hasAnyRole } from '@/features/auth';
import { routeConfig } from '../router/routeConfig';
import type { RouteDefinition } from '../router/routeConfig';

const staffMenu: readonly RouteDefinition[] = [routeConfig.workspace, routeConfig.tickets, routeConfig.create, routeConfig.admin];
const requesterMenu: readonly RouteDefinition[] = [routeConfig.home, routeConfig.create, routeConfig.tickets];

/** Staff start from the queue (PRD J-02); requesters from their own overview and new request (J-01). */
export function isStaffAccount(roles: readonly string[]) {
  return hasAnyRole(roles, ['Agent', 'Admin']);
}

export function getNavigation(roles: readonly string[]) {
  return (isStaffAccount(roles) ? staffMenu : requesterMenu).flatMap((route) =>
    route.label && hasAnyRole(roles, route.menuRoles ?? route.roles) ? [{ key: route.path, label: route.label }] : []);
}
