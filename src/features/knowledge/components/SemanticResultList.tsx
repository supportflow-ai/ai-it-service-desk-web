import { Space, Typography } from 'antd';
import { groupMatches } from '../model/semanticResults';
import type { SemanticMatch } from '../model/knowledge.types';
import { SemanticResultCard } from './SemanticResultCard';

/** Semantic search results, one card per source article, the closest first (TC-361). */
export function SemanticResultList({ matches }: { matches: readonly SemanticMatch[] }) {
  const groups = groupMatches(matches);
  return (
    <section aria-label="Kết quả tìm theo nghĩa">
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '0 0 8px' }}>
        {groups.length} bài viết có nội dung gần với câu hỏi, xếp theo độ liên quan.
      </Typography.Paragraph>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {groups.map((group) => <SemanticResultCard key={group.articleId} group={group} />)}
      </Space>
    </section>
  );
}
