import { Tag, Tooltip } from 'antd';
import { formatModelScore, relevanceBand, relevanceLabels } from '../model/semanticResults';
import type { RelevanceBand } from '../model/semanticResults';

const tones: Record<RelevanceBand, string> = { high: 'green', medium: 'blue', low: 'default' };

/** How closely a passage matches, as a band; the raw score only in the tooltip, never as "%" (Spec §11.3). */
export function RelevanceTag({ score }: { score: number }) {
  const band = relevanceBand(score);
  return (
    <Tooltip title={`Điểm mô hình ${formatModelScore(score)}: dùng để xếp hạng kết quả, không phải xác suất đúng.`}>
      <Tag color={tones[band]} style={{ margin: 0 }} tabIndex={0}>Độ liên quan: {relevanceLabels[band]}</Tag>
    </Tooltip>
  );
}
