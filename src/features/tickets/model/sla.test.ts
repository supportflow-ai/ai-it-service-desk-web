import { describe, expect, it } from 'vitest';
import { ticketA } from '../../../../tests/fixtures';
import { formatSlaDuration, nextSlaDeadline, slaFilterIgnored, slaRemainingText, slaStatusMeta } from './sla';
import type { SlaClockDto, SlaSummaryDto, TicketDto } from './ticket.types';

const clock = (patch: Partial<SlaClockDto> = {}): SlaClockDto => ({
  targetMinutes: 240, elapsedMinutes: 100, remainingMinutes: 140, deadline: '2026-10-19T04:00:00Z', isBreached: false, state: 'RunningOnTrack', ...patch,
});
const summary = (patch: Partial<SlaSummaryDto> = {}): SlaSummaryDto => ({
  isApplicable: true, evaluatedAt: '2026-10-19T00:00:00Z', overallStatus: 'OnTrack', firstResponse: clock(), resolution: clock(), ...patch,
});

describe('SLA display model', () => {
  it('maps the backend overall status to a label and tone, and never guesses an unknown one', () => {
    expect(slaStatusMeta(summary({ overallStatus: 'OnTrack' }))).toEqual({ label: 'Đúng hạn', tone: 'ok' });
    expect(slaStatusMeta(summary({ overallStatus: 'AtRisk' }))).toEqual({ label: 'Sắp vi phạm', tone: 'wn' });
    expect(slaStatusMeta(summary({ overallStatus: 'Breached' }))).toEqual({ label: 'Đã vi phạm', tone: 'er' });
    expect(slaStatusMeta(summary({ overallStatus: 'Completed' })).tone).toBe('neutral');
    expect(slaStatusMeta(summary({ overallStatus: 'SomethingNew' })).tone).toBe('neutral');
    // A ticket outside the SLA is "not applicable" whatever else the payload says.
    expect(slaStatusMeta(summary({ isApplicable: false, overallStatus: 'Breached' })).label).toBe('Không áp dụng SLA');
  });

  it('formats durations in whole units and drops minutes once past a day', () => {
    expect(formatSlaDuration(0.2)).toBe('dưới 1 phút');
    expect(formatSlaDuration(45)).toBe('45 phút');
    expect(formatSlaDuration(135)).toBe('2 giờ 15 phút');
    expect(formatSlaDuration(120)).toBe('2 giờ');
    expect(formatSlaDuration(1440 + 125)).toBe('1 ngày 2 giờ');
    expect(formatSlaDuration(-30)).toBe('30 phút');
  });

  it('says how long is left, or how late, and nothing when the backend sent no remaining time', () => {
    expect(slaRemainingText(clock({ remainingMinutes: 90 }))).toBe('Còn 1 giờ 30 phút');
    expect(slaRemainingText(clock({ remainingMinutes: -10 }))).toBe('Quá hạn 10 phút');
    expect(slaRemainingText(clock({ remainingMinutes: null }))).toBeNull();
  });

  it('picks the soonest deadline among clocks that are still running', () => {
    const early = '2026-10-19T02:00:00Z';
    expect(nextSlaDeadline(summary({ firstResponse: clock({ deadline: '2026-10-19T05:00:00Z' }), resolution: clock({ deadline: early }) }))).toBe(early);
    // A finished first response no longer counts, a paused resolution has no deadline.
    expect(nextSlaDeadline(summary({ firstResponse: clock({ state: 'CompletedAchieved', deadline: early }), resolution: clock({ state: 'PausedOnTrack', deadline: null }) }))).toBeNull();
    expect(nextSlaDeadline(summary({ isApplicable: false }))).toBeNull();
    expect(nextSlaDeadline(undefined)).toBeNull();
    expect(nextSlaDeadline(summary({ firstResponse: clock({ deadline: 'not a date' }), resolution: undefined }))).toBeNull();
  });

  it('notices a backend that ignored the SLA filter, but not a filtered empty result', () => {
    const withSla: TicketDto = { ...ticketA, status: 1, categoryId: 'NET', sla: summary() };
    const withoutSla: TicketDto = { ...ticketA, status: 1, categoryId: 'NET' };
    expect(slaFilterIgnored('AtRisk', [withSla, withoutSla])).toBe(true);
    expect(slaFilterIgnored('AtRisk', [withSla])).toBe(false);
    expect(slaFilterIgnored('AtRisk', [])).toBe(false);
    expect(slaFilterIgnored(null, [withoutSla])).toBe(false);
  });
});
