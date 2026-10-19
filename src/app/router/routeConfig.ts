import type { Role } from '@/features/auth';

interface RouteDefinition { path: string; roles: readonly Role[]; label?: string }
export const routeConfig = {
  home: { path: '/', roles: [] },
  tickets: { path: '/requester-dashboard/tickets', roles: ['Requester', 'Agent', 'Admin'], label: 'Yêu cầu của tôi' },
  ticket: { path: '/requester-dashboard/tickets/:id', roles: ['Requester', 'Agent', 'Admin'] },
  create: { path: '/tickets/new', roles: ['Requester', 'Agent', 'Admin'] },
  workspace: { path: '/agent-workspace', roles: ['Agent', 'Admin'], label: 'Không gian làm việc (Agent)' },
  workspaceTicket: { path: '/agent-workspace/tickets/:id', roles: ['Agent', 'Admin'] },
  admin: { path: '/admin-panel', roles: ['Admin'], label: 'Quản trị hệ thống' },
} as const satisfies Record<string, RouteDefinition>;
