import { Card, Space, Tag, Typography } from 'antd';
import { articleExcerpt } from '../model/articleExcerpt';
import type { SemanticArticleGroup, SemanticMatch } from '../model/knowledge.types';
import { formatArticleDate } from '../lib/formatArticleDate';
import { RelevanceTag } from './RelevanceTag';

function sectionName(match: SemanticMatch) {
  return match.section ?? 'Phần mở đầu';
}

/**
 * One source article of a semantic search (TC-361): its closest passage with the section it comes
 * from and how relevant it is, the article's own metadata, and the other passages that matched.
 */
export function SemanticResultCard({ group }: { group: SemanticArticleGroup }) {
  const { best, others } = group;
  return (
    <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{group.title}</Typography.Title>
        <RelevanceTag score={best.score} />
      </div>
      <div className="meta" style={{ marginTop: 4 }}>Mục: {sectionName(best)}</div>
      {/* Plain text: a passage is stored as Markdown and never goes through a renderer here. */}
      <Typography.Paragraph style={{ margin: '6px 0 0' }}>{articleExcerpt(best.snippet, 280)}</Typography.Paragraph>

      {others.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Đoạn khác cũng khớp trong bài này:</Typography.Text>
          <ul aria-label={`Đoạn khác khớp trong bài ${group.title}`} style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {others.map((match, index) => (
              <li key={`${match.section ?? ''}-${index}`} style={{ fontSize: 13 }}>
                {sectionName(match)} <RelevanceTag score={match.score} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Space wrap size={[6, 6]} style={{ marginTop: 8 }}>
        <span className="meta">Nguồn: {group.title} · Phiên bản {group.version} · Xuất bản {formatArticleDate(group.publishedAt, false)}</span>
        {group.tags.map((tag) => <Tag key={tag} style={{ margin: 0 }}>{tag}</Tag>)}
      </Space>
    </Card>
  );
}
