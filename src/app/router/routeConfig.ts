import type { Role } from '@/features/auth';

/** `menuRoles` narrows who sees a route in the menu when that differs from who may open it. */
export interface RouteDefinition { path: string; roles: readonly Role[]; label?: string; menuRoles?: readonly Role[] }
export const routeConfig = {
  home: { path: '/', roles: [], label: 'Tổng quan', menuRoles: ['Requester'] },
  // Staff may open a ticket from here, but the list is the requests a Requester raised: only they see it in the menu.
  tickets: { path: '/requester-dashboard/tickets', roles: ['Requester', 'Agent', 'Admin'], label: 'Yêu cầu của tôi', menuRoles: ['Requester'] },
  ticket: { path: '/requester-dashboard/tickets/:id', roles: ['Requester', 'Agent', 'Admin'] },
  // Every role may raise a request (project owner's decision, 2026-11-13). PRD J-01 and Spec UC-02/UC-05 name only the Requester, so they are out of date here.
  create: { path: '/tickets/new', roles: ['Requester', 'Agent', 'Admin'], label: 'Tạo yêu cầu' },
  workspace: { path: '/agent-workspace', roles: ['Agent', 'Admin'], label: 'Hàng đợi xử lý' },
  workspaceTicket: { path: '/agent-workspace/tickets/:id', roles: ['Agent', 'Admin'] },
  // Published articles are read by everyone signed in (RequireRequester admits Requester, Agent, Admin).
  knowledge: { path: '/knowledge', roles: ['Requester', 'Agent', 'Admin'], label: 'Kho tri thức' },
  // `/knowledge/manage` is matched before this: a static segment ranks above `:id`.
  knowledgeArticle: { path: '/knowledge/:id', roles: ['Requester', 'Agent', 'Admin'] },
  // Knowledge authoring needs Agent or Admin (RequireAgent at backend dev 1506a5b).
  knowledgeAdmin: { path: '/knowledge/manage', roles: ['Agent', 'Admin'], label: 'Kho tri thức' },
  knowledgeNew: { path: '/knowledge/manage/new', roles: ['Agent', 'Admin'] },
  knowledgeRead: { path: '/knowledge/manage/:id', roles: ['Agent', 'Admin'] },
  knowledgeEdit: { path: '/knowledge/manage/:id/edit', roles: ['Agent', 'Admin'] },
  admin: { path: '/admin-panel', roles: ['Admin'], label: 'Quản trị hệ thống' },
  forgotPassword: { path: '/forgot-password', roles: [] },
} as const satisfies Record<string, RouteDefinition>;
