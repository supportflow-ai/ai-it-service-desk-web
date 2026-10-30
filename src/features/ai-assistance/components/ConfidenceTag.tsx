import { Tag, Tooltip } from 'antd';
import type { ConfidenceBand } from '../model/ai.types';
import { confidenceLabels } from '../model/triageDisplay';

const colorMap: Record<ConfidenceBand, string> = { Low: 'orange', Medium: 'blue', High: 'green' };

/**
 * Displays a confidence band tag with tooltip explaining the score semantics.
 * IMPORTANT: Never displays "probability" or "accuracy" — this is a model score
 * used to help reviewers prioritize which suggestions to examine.
 */
export function ConfidenceTag({ band, score }: { band: ConfidenceBand | null; score?: number | null }) {
  if (!band) return null;

  const tooltipText = score != null
    ? `Điểm mô hình: ${score.toFixed(2)}. Dùng để ưu tiên xem xét, không phải xác suất đúng.`
    : 'Mức tin cậy để ưu tiên xem xét, không phải xác suất đúng.';

  return (
    <Tooltip title={tooltipText}>
      <Tag color={colorMap[band]}>Độ tin cậy: {confidenceLabels[band]}</Tag>
    </Tooltip>
  );
}
