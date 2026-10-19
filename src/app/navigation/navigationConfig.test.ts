import { expect, it } from 'vitest';
import { getNavigation } from './navigationConfig';
import { hasAnyRole } from '@/features/auth';

it.each([
  [['Requester'], ['/requester-dashboard/tickets']],
  [['Agent'], ['/requester-dashboard/tickets', '/agent-workspace']],
  [['Admin'], ['/requester-dashboard/tickets', '/agent-workspace', '/admin-panel']],
  [['Requester', 'Agent'], ['/requester-dashboard/tickets', '/agent-workspace']],
  [['Unknown'], []],
])('derives menu permissions for %j', (roles, paths) => {
  expect(getNavigation(roles).map((item) => item.key)).toEqual(paths);
});
it('does not infer unknown role privileges', () => {
  expect(hasAnyRole(['Lead', 'Superuser'], ['Admin', 'Agent', 'Requester'])).toBe(false);
});
