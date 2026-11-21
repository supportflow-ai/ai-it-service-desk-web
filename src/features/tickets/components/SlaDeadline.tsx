import { Typography } from 'antd';
import type { SlaSummaryDto } from '../model/ticket.types';
import { nextSlaDeadline } from '../model/sla';
import { formatSlaDateTime } from '../lib/formatSlaDateTime';

/** Queue-row hint: the soonest deadline of a clock that is still counting; nothing for finished or paused SLAs. */
export function SlaDeadline({ sla }: { sla: SlaSummaryDto | null | undefined }) {
  const deadline = nextSlaDeadline(sla);
  if (deadline === null) return null;
  return (
    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
      Hạn {formatSlaDateTime(deadline)}
    </Typography.Text>
  );
}
