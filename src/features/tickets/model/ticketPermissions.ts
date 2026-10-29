import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';

// These are UI eligibility checks only. The server still authorizes each request.
export function canOpenWorkspace(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

export function canAddInternalNote(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

export const ticketCapabilities = {
  timeline: true,
  comments: true,
  internalNotes: true,
  triage: false,
  assign: false,
  claim: false,
  start: false,
  requestInformation: false,
  resolve: false,
  close: false,
  reopen: false,
  cancel: false,
  attachments: false,
} as const;
