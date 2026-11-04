import { Card, Typography } from 'antd';
import { normalizeError } from '@/shared/api/httpError';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useKnowledgeArticles } from '../hooks/useKnowledgeArticles';
import { useKnowledgeFilters } from '../hooks/useKnowledgeFilters';
import { KnowledgeToolbar } from '../components/KnowledgeToolbar';
import { KnowledgeTable } from '../components/KnowledgeTable';
import type { ArticleListFilters } from '../model/knowledge.types';

/** Agent/Admin list of every article (TC-337); the route guard keeps requesters out. */
export function KnowledgeAdminPage() {
  const { filters, setFilters } = useKnowledgeFilters();
  const articles = useKnowledgeArticles(filters);
  const errorStatus = articles.error ? normalizeError(articles.error).status : undefined;
  // 403/404 means the list is no longer ours to show, even if an older page is cached.
  const result = errorStatus === 403 || errorStatus === 404 ? undefined : articles.data;

  // Any filter change starts again from the first page.
  const changeFilters = (patch: Partial<ArticleListFilters>) => setFilters({ ...filters, ...patch, page: 1 });

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ margin: '0 0 12px', fontWeight: 700 }}>
        Kho tri thức
      </Typography.Title>

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
