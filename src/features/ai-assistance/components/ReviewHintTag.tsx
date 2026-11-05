import { Tag, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ConfidenceBand } from '../model/ai.types';
import { needsReview, reviewHint } from '../model/triageDisplay';

/** How much checking a suggestion needs, with the reason in the tooltip; nothing for High. */
export function ReviewHintTag({ band }: { band: ConfidenceBand | null }) {
  const hint = reviewHint(band);
  if (!hint) return null;
  return (
    <Tooltip title={hint.detail}>
      <Tag color={hint.color} icon={needsReview(band) ? <ExclamationCircleOutlined /> : undefined} tabIndex={0}>{hint.label}</Tag>
    </Tooltip>
  );
}
