import { SlaQueueStatus } from './ticket.types';
import type { SlaClockDto, SlaSummaryDto, TicketDto } from './ticket.types';

export type SlaTone = 'ok' | 'wn' | 'er' | 'neutral';

export interface SlaStatusMeta {
  label: string;
  tone: SlaTone;
}

// Overall values follow SlaEvaluator.DetermineOverallStatus on the backend.
export const slaOverallMeta: Readonly<Record<string, SlaStatusMeta>> = {
  OnTrack: { label: 'Đúng hạn', tone: 'ok' },
  AtRisk: { label: 'Sắp vi phạm', tone: 'wn' },
  Breached: { label: 'Đã vi phạm', tone: 'er' },
  Completed: { label: 'Đã hoàn tất', tone: 'neutral' },
  NotApplicable: { label: 'Không áp dụng SLA', tone: 'neutral' },
};

const unknownMeta: SlaStatusMeta = { label: 'Trạng thái SLA khác', tone: 'neutral' };

export function slaStatusMeta(sla: SlaSummaryDto): SlaStatusMeta {
  if (!sla.isApplicable) return slaOverallMeta.NotApplicable ?? unknownMeta;
  return slaOverallMeta[sla.overallStatus] ?? unknownMeta;
}

// Clock states follow SlaEvaluator.EvaluateFirstResponse / EvaluateResolution.
export const slaClockStateLabels: Readonly<Record<string, string>> = {
  RunningOnTrack: 'Đang chạy · đúng hạn',
  RunningAtRisk: 'Đang chạy · sắp vi phạm',
  RunningBreached: 'Đang chạy · đã vi phạm',
  PausedOnTrack: 'Tạm dừng · đúng hạn',
  PausedAtRisk: 'Tạm dừng · sắp vi phạm',
  PausedBreached: 'Tạm dừng · đã vi phạm',
  CompletedAchieved: 'Đã phản hồi đúng hạn',
  CompletedBreached: 'Đã phản hồi nhưng trễ hạn',
  ResolvedAchieved: 'Đã giải quyết đúng hạn',
  ResolvedBreached: 'Đã giải quyết nhưng trễ hạn',
  Closed: 'Đã đóng',
  ClosedBreached: 'Đã đóng · trễ hạn',
  Cancelled: 'Đã hủy',
  CancelledBreached: 'Đã hủy · trễ hạn',
  NotApplicable: 'Không áp dụng',
};

export function slaClockStateLabel(clock: SlaClockDto) {
  return slaClockStateLabels[clock.state] ?? 'Trạng thái khác';
}

/** Only a clock that is still counting (or paused) has remaining time worth showing. */
export function isOpenSlaClock(clock: SlaClockDto) {
  return clock.state.startsWith('Running') || clock.state.startsWith('Paused');
}

/** "2 giờ 15 phút", "45 phút", "3 ngày 2 giờ": minutes in, rounded to the whole minute. */
export function formatSlaDuration(minutes: number) {
  const total = Math.round(Math.abs(minutes));
  if (total < 1) return 'dưới 1 phút';
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  // Past a day the minutes are noise.
  if (mins > 0 && days === 0) parts.push(`${mins} phút`);
  return parts.join(' ');
}

/** "Còn 2 giờ" before the deadline, "Quá hạn 10 phút" after it; null when the backend sent no remaining time. */
export function slaRemainingText(clock: SlaClockDto) {
  if (clock.remainingMinutes === null) return null;
  return clock.remainingMinutes >= 0
    ? `Còn ${formatSlaDuration(clock.remainingMinutes)}`
    : `Quá hạn ${formatSlaDuration(clock.remainingMinutes)}`;
}

/** The soonest deadline among the clocks still counting, for the queue row; null when none is. */
export function nextSlaDeadline(sla: SlaSummaryDto | null | undefined) {
  if (!sla || !sla.isApplicable) return null;
  const deadlines = [sla.firstResponse, sla.resolution]
    .filter((clock): clock is SlaClockDto => clock !== undefined && clock.state.startsWith('Running') && clock.deadline !== null)
    .map((clock) => clock.deadline as string)
    .filter((deadline) => !Number.isNaN(new Date(deadline).getTime()))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return deadlines[0] ?? null;
}

export const slaQueueOptions: readonly { value: SlaQueueStatus; label: string }[] = [
  { value: SlaQueueStatus.OnTrack, label: slaOverallMeta.OnTrack?.label ?? SlaQueueStatus.OnTrack },
  { value: SlaQueueStatus.AtRisk, label: slaOverallMeta.AtRisk?.label ?? SlaQueueStatus.AtRisk },
  { value: SlaQueueStatus.Breached, label: slaOverallMeta.Breached?.label ?? SlaQueueStatus.Breached },
];

/**
 * An SLA filter is on, tickets came back, and some carry no `sla` at all: the backend does not know
 * the SLA contract yet and ignored the filter, so the list is not filtered. A null `sla` on the
 * wire is read as absent, so it is treated the same way.
 */
export function slaFilterIgnored(slaStatus: SlaQueueStatus | null, items: readonly TicketDto[]) {
  return slaStatus !== null && items.some((ticket) => ticket.sla === undefined);
}
