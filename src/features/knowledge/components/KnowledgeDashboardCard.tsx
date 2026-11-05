import { Button, Card, Input, Skeleton, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { usePublishedArticles } from '../hooks/usePublishedArticles';
import { formatArticleDate } from '../lib/formatArticleDate';
import { KNOWLEDGE_PATH, publishedArticlePath } from '../lib/knowledgePaths';
import { toPublishedSearch } from '../lib/knowledgeSearch';
import { defaultArticleListFilters } from '../model/articleList';
import type { PublishedSearchFilters } from '../model/knowledge.types';

const latest: PublishedSearchFilters = { ...defaultArticleListFilters, pageSize: 3 };

/** The requester overview's way into the knowledge base: a search box and the newest articles. */
export function KnowledgeDashboardCard() {
  const navigate = useNavigate();
  const articles = usePublishedArticles(latest);
  const items = articles.data?.items;

  const search = (value: string) => {
    const query = toPublishedSearch({ ...defaultArticleListFilters, query: value.trim() }).toString();
    navigate(query ? `${KNOWLEDGE_PATH}?${query}` : KNOWLEDGE_PATH);
  };

  return (
    <Card bordered style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
      <Input.Search
        aria-label="Tìm bài viết hướng dẫn"
        allowClear
        maxLength={200}
        placeholder="Tìm bài viết hướng dẫn…"
        onSearch={search}
        style={{ marginBottom: 16 }}
      />
      <Typography.Text strong>Bài viết mới</Typography.Text>
      <div style={{ marginTop: 8 }}>
        {articles.isPending && <Skeleton active title={false} paragraph={{ rows: 3 }} />}
        {articles.isError && !items && (
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Chưa tải được bài viết. <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { void articles.refetch(); }}>Thử lại</Button>
          </Typography.Paragraph>
        )}
        {items?.length === 0 && <Typography.Paragraph type="secondary" style={{ margin: 0 }}>Chưa có bài viết nào được xuất bản.</Typography.Paragraph>}
        {items && items.length > 0 && (
          <ul aria-label="Bài viết mới" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((article) => (
              <li key={article.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--bd)' }}>
                <Link to={publishedArticlePath(article.id)} style={{ fontWeight: 500 }}>{article.title}</Link>
                <div className="meta">Xuất bản {formatArticleDate(article.publishedAt ?? article.updatedAt, false)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ marginTop: 12 }}><Link to={KNOWLEDGE_PATH}>Xem tất cả bài viết</Link></div>
    </Card>
  );
}
