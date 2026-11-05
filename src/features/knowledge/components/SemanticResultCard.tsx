import { Card, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { articleExcerpt } from '../model/articleExcerpt';
import type { SemanticArticleGroup, SemanticMatch } from '../model/knowledge.types';
import { formatArticleDate } from '../lib/formatArticleDate';
import { publishedArticlePath } from '../lib/knowledgePaths';
import type { KnowledgeResultsState, KnowledgeSourceState } from '../lib/knowledgePaths';
import { RelevanceTag } from './RelevanceTag';

function sectionName(match: SemanticMatch) {
  return match.section ?? 'Phần mở đầu';
}

interface SemanticResultCardProps {
  group: SemanticArticleGroup;
  /** Carried to the article, to come back to the same results. */
  resultsState: KnowledgeResultsState;
}

/**
 * One source article of a semantic search (TC-361): its closest passage with the section it comes
 * from and how relevant it is, the article's own metadata, and the other passages that matched.
 * Each opens the Published article at its own section (TC-362).
 */
export function SemanticResultCard({ group, resultsState }: SemanticResultCardProps) {
  const { best, others } = group;
  const source = (match: SemanticMatch): KnowledgeSourceState => ({ ...resultsState, section: match.section });
  return (
    <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          <Link to={publishedArticlePath(group.articleId)} state={source(best)}>{group.title}</Link>
        </Typography.Title>
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
                <Link to={publishedArticlePath(group.articleId)} state={source(match)} aria-label={`Mở bài ${group.title} tại mục ${sectionName(match)}`}>
                  {sectionName(match)}
                </Link>{' '}
                <RelevanceTag score={match.score} />
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
