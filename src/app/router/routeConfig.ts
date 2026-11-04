import type { Role } from '@/features/auth';

/** `menuRoles` narrows who sees a route in the menu when that differs from who may open it. */
export interface RouteDefinition { path: string; roles: readonly Role[]; label?: string; menuRoles?: readonly Role[] }
export const routeConfig = {
  home: { path: '/', roles: [], label: 'Tổng quan', menuRoles: ['Requester'] },
  tickets: { path: '/requester-dashboard/tickets', roles: ['Requester', 'Agent', 'Admin'], label: 'Yêu cầu của tôi' },
  ticket: { path: '/requester-dashboard/tickets/:id', roles: ['Requester', 'Agent', 'Admin'] },
  create: { path: '/tickets/new', roles: ['Requester', 'Agent', 'Admin'], label: 'Tạo yêu cầu' },
  workspace: { path: '/agent-workspace', roles: ['Agent', 'Admin'], label: 'Hàng đợi xử lý' },
  workspaceTicket: { path: '/agent-workspace/tickets/:id', roles: ['Agent', 'Admin'] },
  // Knowledge authoring needs Agent or Admin (RequireAgent at backend dev 1506a5b).
  knowledgeAdmin: { path: '/knowledge/manage', roles: ['Agent', 'Admin'], label: 'Kho tri thức' },
  admin: { path: '/admin-panel', roles: ['Admin'], label: 'Quản trị hệ thống' },
} as const satisfies Record<string, RouteDefinition>;
