import { Card, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import type { ArticleDto } from '../model/knowledge.types';
import { articleExcerpt } from '../model/articleExcerpt';
import { formatArticleDate } from '../lib/formatArticleDate';
import { knowledgeTagPath, publishedArticlePath } from '../lib/knowledgePaths';
import type { KnowledgeResultsState } from '../lib/knowledgePaths';

interface PublishedArticleCardProps {
  article: ArticleDto;
  /** Carried to the article, to come back to the same results. */
  resultsState: KnowledgeResultsState;
}

/** One search result (TC-342): the title opens the article, a tag narrows the search to it. */
export function PublishedArticleCard({ article, resultsState }: PublishedArticleCardProps) {
  const excerpt = articleExcerpt(article.content);
  return (
    <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
      <Typography.Title level={3} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
        <Link to={publishedArticlePath(article.id)} state={resultsState}>{article.title}</Link>
      </Typography.Title>
      {/* Plain text: the excerpt never goes through the Markdown renderer. */}
      {excerpt && <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0' }}>{excerpt}</Typography.Paragraph>}
      <Space wrap size={[6, 6]} style={{ marginTop: 8 }}>
        {article.tags.map((tag) => (
          <Link key={tag} to={knowledgeTagPath(tag)} aria-label={`Lọc theo tag ${tag}`}><Tag style={{ margin: 0 }}>{tag}</Tag></Link>
        ))}
        <span className="meta">Xuất bản {formatArticleDate(article.publishedAt ?? article.updatedAt, false)}</span>
      </Space>
    </Card>
  );
}
