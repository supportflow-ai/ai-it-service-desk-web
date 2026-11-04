import { Button, Card, Empty, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { normalizeError } from '@/shared/api/httpError';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useKnowledgeArticles } from '../hooks/useKnowledgeArticles';
import { useKnowledgeFilters } from '../hooks/useKnowledgeFilters';
import { KnowledgeToolbar } from '../components/KnowledgeToolbar';
import { KnowledgeTable } from '../components/KnowledgeTable';
import { NEW_ARTICLE_PATH } from '../lib/knowledgePaths';
import { articleListEmptyKind, defaultArticleListFilters } from '../model/articleList';
import type { KnowledgeListState } from '../lib/knowledgePaths';
import type { ArticleListFilters } from '../model/knowledge.types';

/** Agent/Admin list of every article (TC-337); the route guard keeps requesters out. */
export function KnowledgeAdminPage() {
  const navigate = useNavigate();
  const { filters, setFilters, search } = useKnowledgeFilters();
  const articles = useKnowledgeArticles(filters);
  const errorStatus = articles.error ? normalizeError(articles.error).status : undefined;
  // 403/404 means the list is no longer ours to show, even if an older page is cached.
  const result = errorStatus === 403 || errorStatus === 404 ? undefined : articles.data;

  // Any filter change starts again from the first page.
  const changeFilters = (patch: Partial<ArticleListFilters>) => setFilters({ ...filters, ...patch, page: 1 });
  const listState: KnowledgeListState = { listSearch: search };
  const writeNew = () => navigate(NEW_ARTICLE_PATH, { state: listState });
  const emptyText = {
    // The table's own spinner shows over this.
    loading: <div style={{ minHeight: 96 }} />,
    failed: <Typography.Text type="secondary">Chưa tải được danh sách bài viết.</Typography.Text>,
    pageGone: (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`Trang ${filters.page} không còn bài viết nào.`}>
        <Button onClick={() => setFilters({ ...filters, page: 1 })}>Về trang đầu</Button>
      </Empty>
    ),
    noMatch: (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có bài viết nào phù hợp với bộ lọc.">
        <Button onClick={() => setFilters({ ...defaultArticleListFilters, pageSize: filters.pageSize })}>Xóa bộ lọc</Button>
      </Empty>
    ),
    noArticles: (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Kho tri thức chưa có bài viết nào.">
        <Button type="primary" onClick={writeNew}>Viết bài đầu tiên</Button>
      </Empty>
    ),
  }[articleListEmptyKind(filters, result !== undefined, articles.isError)];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '0 0 12px' }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          Kho tri thức
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={writeNew} style={{ borderRadius: 6 }}>
          Viết bài mới
        </Button>
      </div>

      <KnowledgeToolbar filters={filters} totalCount={result?.totalCount} onChange={changeFilters} />

      {articles.error && (
        <div style={{ marginBottom: 12 }}>
          <ErrorState error={articles.error} onRetry={() => { void articles.refetch(); }} />
        </div>
      )}

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, borderColor: 'var(--bd)', overflow: 'hidden' }}>
        <KnowledgeTable
          result={result}
          loading={articles.isFetching}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page, pageSize) => setFilters({ ...filters, page: pageSize === filters.pageSize ? page : 1, pageSize })}
          onReload={() => { void articles.refetch(); }}
          listState={listState}
          emptyText={emptyText}
        />
      </Card>
    </div>
  );
}
