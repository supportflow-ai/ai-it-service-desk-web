import { expect, it } from 'vitest';
import { getNavigation } from './navigationConfig';
import { hasAnyRole } from '@/features/auth';

it.each([
  [['Requester'], ['/', '/tickets/new', '/requester-dashboard/tickets', '/knowledge']],
  [['Agent'], ['/agent-workspace', '/admin/support-teams', '/knowledge/manage', '/tickets/new']],
  [['Admin'], ['/agent-workspace', '/admin/support-teams', '/admin/departments', '/admin/service-catalog', '/knowledge/manage', '/tickets/new', '/admin-panel']],
  [['Requester', 'Agent'], ['/agent-workspace', '/admin/support-teams', '/knowledge/manage', '/requester-dashboard/tickets', '/tickets/new']],
  [['Unknown'], []],
])('derives the menu and its order for %j', (roles, paths) => {
  expect(getNavigation(roles).map((item) => item.key)).toEqual(paths);
});
it('does not infer unknown role privileges', () => {
  expect(hasAnyRole(['Lead', 'Superuser'], ['Admin', 'Agent', 'Requester'])).toBe(false);
});
