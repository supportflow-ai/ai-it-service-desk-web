import { isRecord } from '@/shared/lib/guards';

/** Router state the create screen hands to the new ticket's page. */
export interface CreatedTicketState {
  /** Files chosen on the create screen that could not be attached. */
  failedUploads: string[];
}

export function readFailedUploads(state: unknown): string[] {
  if (!isRecord(state) || !Array.isArray(state.failedUploads)) return [];
  return state.failedUploads.filter((name): name is string => typeof name === 'string');
}
