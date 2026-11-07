import { Button, Card, Empty, Input, Pagination, Skeleton, Space, Spin, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { usePublishedArticles } from '../hooks/usePublishedArticles';
import { usePublishedSearch } from '../hooks/usePublishedSearch';
import type { KnowledgeResultsState } from '../lib/knowledgePaths';
import { ARTICLE_PAGE_SIZES, articleListEmptyKind, defaultArticleListFilters } from '../model/articleList';
import type { PagedArticleResult, PublishedSearchFilters } from '../model/knowledge.types';
import { PublishedArticleCard } from '../components/PublishedArticleCard';

interface KnowledgeSearchPageProps {
  /** Where a reader who found no answer asks for help; the app passes the create-request route. */
  /** Where a reader who found no answer goes on; absent for staff, who do not raise requests. */
  helpPath?: string;
}

function summary(result: PagedArticleResult, { query, tag }: PublishedSearchFilters) {
  if (!query && !tag) return `${result.totalCount} bài viết`;
  return [`${result.totalCount} kết quả`, query && `cho “${query}”`, tag && `với tag “${tag}”`].filter(Boolean).join(' ');
}

/** Published articles for everyone signed in (TC-342): keyword search, tag filter and paging. */
export function KnowledgeSearchPage({ helpPath }: KnowledgeSearchPageProps) {
  const navigate = useNavigate();
  const { filters, setFilters, search } = usePublishedSearch();
  const articles = usePublishedArticles(filters);
  const result = articles.data;
  const resultsState: KnowledgeResultsState = { resultsSearch: search };
  const reload = () => { void articles.refetch(); };
  const askForHelp = helpPath ? <Button type="primary" onClick={() => navigate(helpPath)}>Tạo yêu cầu hỗ trợ</Button> : null;

  const empty = {
    loading: (
      <Space direction="vertical" size={12} style={{ width: '100%' }} aria-busy="true" aria-label="Đang tải bài viết">
        {[0, 1, 2].map((key) => <Card key={key} size="small"><Skeleton active paragraph={{ rows: 2 }} /></Card>)}
      </Space>
    ),
    // The error above says what failed and offers a retry.
    failed: null,
    pageGone: (
      <Empty description={`Trang ${filters.page} không còn bài viết nào.`}>
        <Button onClick={() => setFilters({ ...filters, page: 1 })}>Về trang đầu</Button>
      </Empty>
    ),
    noMatch: (
      <Empty description="Không tìm thấy bài viết nào phù hợp. Thử từ khóa khác, hoặc gửi yêu cầu để kỹ thuật viên hỗ trợ.">
        <Space wrap style={{ justifyContent: 'center' }}>
          <Button onClick={() => setFilters({ ...defaultArticleListFilters, pageSize: filters.pageSize })}>Xóa tìm kiếm</Button>
          {askForHelp}
        </Space>
      </Empty>
    ),
    noArticles: <Empty description="Kho tri thức chưa có bài viết nào được xuất bản.">{askForHelp}</Empty>,
  }[articleListEmptyKind({ ...filters, status: null }, result !== undefined, articles.isError)];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>Kho tri thức</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ margin: '4px 0 16px' }}>
        Tìm hướng dẫn tự xử lý các sự cố thường gặp.
      </Typography.Paragraph>

      {/* Remounted when the URL changes, so the box always shows the search in force. */}
      <Input.Search
        key={`q-${filters.query}`}
        aria-label="Tìm bài viết"
        allowClear
        size="large"
        enterButton="Tìm kiếm"
        maxLength={200}
        defaultValue={filters.query}
        placeholder="Nhập từ khóa, ví dụ: VPN, mật khẩu, máy in"
        onSearch={(value) => setFilters({ ...filters, query: value.trim(), page: 1 })}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: 32, margin: '12px 0' }}>
        <span role="status" className="meta">{result ? summary(result, filters) : ''}</span>
        {filters.tag && (
          <>
            <Tag style={{ margin: 0 }}>{filters.tag}</Tag>
            <Button type="link" size="small" onClick={() => setFilters({ ...filters, tag: '', page: 1 })}>Bỏ lọc tag</Button>
          </>
        )}
      </div>

      {articles.error && <div style={{ marginBottom: 12 }}><ErrorState error={articles.error} onRetry={reload} /></div>}

      {result && result.items.length > 0 ? (
        <Spin spinning={articles.isFetching}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {result.items.map((article) => <PublishedArticleCard key={article.id} article={article} resultsState={resultsState} />)}
          </Space>
          <Pagination
            style={{ marginTop: 16 }}
            align="center"
            current={filters.page}
            pageSize={filters.pageSize}
            total={result.totalCount}
            hideOnSinglePage
            showSizeChanger
            pageSizeOptions={[...ARTICLE_PAGE_SIZES]}
            onChange={(page, pageSize) => setFilters({ ...filters, page: pageSize === filters.pageSize ? page : 1, pageSize })}
          />
        </Spin>
      ) : empty}
    </div>
  );
}
