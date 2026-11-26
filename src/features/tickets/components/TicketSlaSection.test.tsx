import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { SlaClockDto, SlaSummaryDto } from '../model/ticket.types';
import { TicketSlaSection } from './TicketSlaSection';

const running: SlaClockDto = {
  targetMinutes: 240, elapsedMinutes: 200, remainingMinutes: 40, deadline: '2026-10-19T04:00:00Z', isBreached: false, state: 'RunningAtRisk',
};
const sla: SlaSummaryDto = {
  isApplicable: true, evaluatedAt: '2026-10-19T03:20:00Z', overallStatus: 'AtRisk', firstResponse: running, resolution: running,
};

it('shows the state, deadline and remaining time of each clock from the backend', () => {
  render(<TicketSlaSection sla={sla} />);
  expect(screen.getByText('Sắp vi phạm')).toBeInTheDocument();
  const first = screen.getByRole('region', { name: 'Phản hồi đầu tiên' });
  expect(within(first).getByText('Đang chạy · sắp vi phạm')).toBeInTheDocument();
  expect(within(first).getByText('4 giờ')).toBeInTheDocument();
  expect(within(first).getByText('Còn 40 phút')).toBeInTheDocument();
  expect(within(first).getByText('Hạn')).toBeInTheDocument();
});

it('shows a breached clock as late and a paused one without a deadline or countdown', () => {
  render(<TicketSlaSection sla={{
    ...sla,
    overallStatus: 'Breached',
    firstResponse: { ...running, isBreached: true, state: 'RunningBreached', remainingMinutes: -15 },
    resolution: { ...running, state: 'PausedOnTrack', deadline: null, remainingMinutes: null },
  }} />);
  expect(screen.getByText('Đã vi phạm')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'Phản hồi đầu tiên' })).getByText('Quá hạn 15 phút')).toBeInTheDocument();
  const resolution = screen.getByRole('region', { name: 'Giải quyết' });
  expect(within(resolution).getByText('Tạm dừng · đúng hạn')).toBeInTheDocument();
  expect(within(resolution).queryByText('Hạn')).not.toBeInTheDocument();
  expect(within(resolution).queryByText('Còn lại')).not.toBeInTheDocument();
});

it('shows a finished clock as achieved, with no countdown', () => {
  render(<TicketSlaSection sla={{
    ...sla,
    overallStatus: 'Completed',
    firstResponse: { ...running, state: 'CompletedAchieved', remainingMinutes: 100 },
    resolution: { ...running, state: 'ResolvedAchieved', deadline: null, remainingMinutes: 80 },
  }} />);
  expect(screen.getByText('Đã phản hồi đúng hạn')).toBeInTheDocument();
  expect(screen.getByText('Đã giải quyết đúng hạn')).toBeInTheDocument();
  expect(screen.queryByText('Còn lại')).not.toBeInTheDocument();
});

it('says so when the ticket is not under an SLA or a clock has no target', () => {
  const { unmount } = render(<TicketSlaSection sla={{ ...sla, isApplicable: false, overallStatus: 'NotApplicable', firstResponse: undefined, resolution: undefined }} />);
  expect(screen.getByText('Ticket này không thuộc cam kết SLA.')).toBeInTheDocument();
  expect(screen.getByText('Không áp dụng SLA')).toBeInTheDocument();
  unmount();

  render(<TicketSlaSection sla={{ ...sla, firstResponse: { ...running, targetMinutes: null, state: 'NotApplicable' } }} />);
  expect(within(screen.getByRole('region', { name: 'Phản hồi đầu tiên' })).getByText('Không áp dụng')).toBeInTheDocument();
});

it('does not invent an SLA when the backend sent none', () => {
  render(<TicketSlaSection sla={undefined} />);
  expect(screen.getByText('Backend chưa trả thông tin SLA cho ticket này.')).toBeInTheDocument();
  expect(screen.getByText('Chưa có thông tin SLA')).toBeInTheDocument();
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
});
