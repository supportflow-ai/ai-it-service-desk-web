import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { normalizeError } from '@/shared/api/httpError';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useKnowledgeArticles } from '../hooks/useKnowledgeArticles';
import { useKnowledgeFilters } from '../hooks/useKnowledgeFilters';
import { KnowledgeToolbar } from '../components/KnowledgeToolbar';
import { KnowledgeTable } from '../components/KnowledgeTable';
import { NEW_ARTICLE_PATH } from '../lib/knowledgePaths';
import type { ArticleListFilters } from '../model/knowledge.types';

/** Agent/Admin list of every article (TC-337); the route guard keeps requesters out. */
export function KnowledgeAdminPage() {
  const navigate = useNavigate();
  const { filters, setFilters } = useKnowledgeFilters();
  const articles = useKnowledgeArticles(filters);
  const errorStatus = articles.error ? normalizeError(articles.error).status : undefined;
  // 403/404 means the list is no longer ours to show, even if an older page is cached.
  const result = errorStatus === 403 || errorStatus === 404 ? undefined : articles.data;

  // Any filter change starts again from the first page.
  const changeFilters = (patch: Partial<ArticleListFilters>) => setFilters({ ...filters, ...patch, page: 1 });

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '0 0 12px' }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          Kho tri thức
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(NEW_ARTICLE_PATH)} style={{ borderRadius: 6 }}>
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
        />
      </Card>
    </div>
  );
}
