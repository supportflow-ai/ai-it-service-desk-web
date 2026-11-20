import { Typography } from 'antd';
import type { SlaSummaryDto } from '../model/ticket.types';
import { slaStatusMeta } from '../model/sla';

const toneClass = { ok: 'ok', wn: 'wn', er: 'er', neutral: '' } as const;

interface SlaStatusBadgeProps {
  /** Undefined or null: the backend sent no SLA data for this ticket. */
  sla: SlaSummaryDto | null | undefined;
}

/** SLA state exactly as the backend evaluated it; with no data it says so instead of guessing. */
export function SlaStatusBadge({ sla }: SlaStatusBadgeProps) {
  if (!sla) return <Typography.Text type="secondary">Chưa có thông tin SLA</Typography.Text>;
  const { label, tone } = slaStatusMeta(sla);
  return (
    <span className={`status-tag ${toneClass[tone]}`} style={{ verticalAlign: 'middle' }}>
      {label}
    </span>
  );
}
