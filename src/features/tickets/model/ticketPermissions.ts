import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';

// These are UI eligibility checks only. The server still authorizes each request.
export function canOpenWorkspace(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}
export const ticketCapabilities = {
  timeline: false, comments: false, triage: false, assign: false,
  start: false, requestInformation: false, resolve: false, attachments: false,
} as const;
