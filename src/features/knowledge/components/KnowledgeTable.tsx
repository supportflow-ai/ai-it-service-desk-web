import { Table, Tag, Tooltip, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import type { ArticleDto, PagedArticleResult } from '../model/knowledge.types';
import { ARTICLE_PAGE_SIZES } from '../model/articleList';
import { canOpenArticle, isArticleAuthor } from '../model/knowledgePermissions';
import { ArticleStatusTag } from './ArticleStatusTag';

interface KnowledgeTableProps {
  result: PagedArticleResult | undefined;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function KnowledgeTable({ result, loading, page, pageSize, onPageChange }: KnowledgeTableProps) {
  const { user } = useAuth();
  return (
    <Table<ArticleDto>
      rowKey="id"
      size="middle"
      dataSource={result?.items ?? []}
      loading={loading}
      locale={{ emptyText: 'Không có bài viết nào phù hợp với bộ lọc.' }}
      columns={[
        {
          title: 'Tiêu đề',
          key: 'title',
          render: (_, article) => (
            <>
              <div style={{ fontWeight: 600, color: 'var(--tx)' }}>{article.title}</div>
              {/* The staff list returns other authors' unpublished articles, which open on 404 only (gap G1). */}
              {!canOpenArticle(user, article) && (
                <Tooltip title="Chỉ tác giả hoặc Admin mở được bài viết chưa xuất bản.">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <LockOutlined /> Bài chưa xuất bản của kỹ thuật viên khác
                  </Typography.Text>
                </Tooltip>
              )}
            </>
          ),
        },
        { title: 'Trạng thái', key: 'status', render: (_, article) => <ArticleStatusTag status={article.status} /> },
        {
          title: 'Tags',
          key: 'tags',
          render: (_, article) => (article.tags.length > 0
            ? article.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
            : <Typography.Text type="secondary">—</Typography.Text>),
        },
        { title: 'Phiên bản', key: 'version', render: (_, article) => `v${article.version}` },
        { title: 'Tác giả', key: 'author', render: (_, article) => (isArticleAuthor(user, article) ? 'Bạn' : 'Người khác') },
        { title: 'Cập nhật', key: 'updated', align: 'right', render: (_, article) => formatDate(article.updatedAt) },
      ]}
      pagination={{
        current: page,
        pageSize,
        total: result?.totalCount ?? 0,
        showSizeChanger: true,
        pageSizeOptions: [...ARTICLE_PAGE_SIZES],
        showTotal: (total, [from, to]) => `${from}–${to} trên ${total} bài viết`,
        onChange: onPageChange,
      }}
    />
  );
}
