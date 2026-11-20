import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import type { SlaClockDto, SlaSummaryDto } from '../model/ticket.types';
import { formatSlaDuration, isOpenSlaClock, slaClockStateLabel, slaRemainingText } from '../model/sla';
import { formatSlaDateTime } from '../lib/formatSlaDateTime';
import { SlaStatusBadge } from './SlaStatusBadge';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
      <span style={{ color: 'var(--tx3)' }}>{label}</span>
      <span style={{ color: 'var(--tx)', textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function SlaClock({ title, clock }: { title: string; clock: SlaClockDto | null }) {
  // A clock the backend sends as null, or without a target, does not apply to this ticket.
  if (clock === null || clock.targetMinutes === null) {
    return (
      <section aria-label={title} style={{ marginTop: 12 }}>
        <strong>{title}</strong>
        <Typography.Text type="secondary" style={{ display: 'block' }}>Không áp dụng</Typography.Text>
      </section>
    );
  }
  const remaining = isOpenSlaClock(clock) ? slaRemainingText(clock) : null;
  return (
    <section aria-label={title} style={{ marginTop: 12 }}>
      <strong>{title}</strong>
      <Typography.Text type={clock.isBreached ? 'danger' : 'secondary'} style={{ display: 'block' }}>
        {slaClockStateLabel(clock)}
      </Typography.Text>
      <Row label="Mục tiêu">{formatSlaDuration(clock.targetMinutes)}</Row>
      {clock.elapsedMinutes !== null && <Row label="Đã dùng">{formatSlaDuration(clock.elapsedMinutes)}</Row>}
      {clock.deadline !== null && <Row label="Hạn">{formatSlaDateTime(clock.deadline)}</Row>}
      {remaining !== null && <Row label="Còn lại">{remaining}</Row>}
    </section>
  );
}

/**
 * The SLA of one ticket, rendered from the backend evaluation. It has three edge states of its own:
 * no data (backend sent none), not applicable, and an applicable SLA with its two clocks.
 */
export function TicketSlaSection({ sla }: { sla: SlaSummaryDto | null | undefined }) {
  let body: ReactNode;
  if (!sla) {
    body = <Typography.Text type="secondary">Backend chưa trả thông tin SLA cho ticket này.</Typography.Text>;
  } else if (!sla.isApplicable) {
    body = <Typography.Text type="secondary">Ticket này không thuộc cam kết SLA.</Typography.Text>;
  } else {
    body = (
      <>
        <SlaClock title="Phản hồi đầu tiên" clock={sla.firstResponse} />
        <SlaClock title="Giải quyết" clock={sla.resolution} />
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 12 }}>
          Đánh giá lúc {formatSlaDateTime(sla.evaluatedAt)}. Mở lại ticket để cập nhật.
        </Typography.Text>
      </>
    );
  }
  return (
    <Card
      title="SLA"
      extra={<SlaStatusBadge sla={sla} />}
      size="small"
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)', fontSize: 13 }}
    >
      {body}
    </Card>
  );
}
