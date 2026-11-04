import { Space, Table, Tag, Tooltip, Typography } from 'antd';
import { EditOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import type { ReactNode } from 'react';
import type { ArticleDto, PagedArticleResult } from '../model/knowledge.types';
import { ARTICLE_PAGE_SIZES } from '../model/articleList';
import { canEditArticle, canOpenArticle, isArticleAuthor } from '../model/knowledgePermissions';
import { formatArticleDate } from '../lib/formatArticleDate';
import { articlePath, editArticlePath } from '../lib/knowledgePaths';
import type { KnowledgeListState } from '../lib/knowledgePaths';
import { ArticleLifecycleActions } from './ArticleLifecycleActions';
import { ArticleStatusTag } from './ArticleStatusTag';

interface KnowledgeTableProps {
  result: PagedArticleResult | undefined;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  /** Refetches the list, e.g. after a row's action found the article changed meanwhile. */
  onReload: () => void;
  /** Carried to an article and its editor, to come back to the same filters. */
  listState: KnowledgeListState;
  emptyText: ReactNode;
}

// Short columns keep to one line; the table scrolls sideways on narrow screens instead.
const oneLine = () => ({ style: { whiteSpace: 'nowrap' as const } });

export function KnowledgeTable({ result, loading, page, pageSize, onPageChange, onReload, listState, emptyText }: KnowledgeTableProps) {
  const { user } = useAuth();
  return (
    <Table<ArticleDto>
      rowKey="id"
      size="middle"
      dataSource={result?.items ?? []}
      loading={loading}
      scroll={{ x: 960 }}
      locale={{ emptyText }}
      columns={[
        {
          title: 'Tiêu đề',
          key: 'title',
          render: (_, article) => (canOpenArticle(user, article)
            ? <Link to={articlePath(article.id)} state={listState} style={{ fontWeight: 600 }}>{article.title}</Link>
            : (
              <>
                {/* A row the user could only open on 404; backend dev before ced117c listed them to Agents (gap G1). */}
                <div style={{ fontWeight: 600, color: 'var(--tx)' }}>{article.title}</div>
                <Tooltip title="Chỉ tác giả hoặc Admin mở được bài viết chưa xuất bản.">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <LockOutlined /> Bài chưa xuất bản của kỹ thuật viên khác
                  </Typography.Text>
                </Tooltip>
              </>
            )),
        },
        { title: 'Trạng thái', key: 'status', onCell: oneLine, render: (_, article) => <ArticleStatusTag status={article.status} /> },
        {
          title: 'Tags',
          key: 'tags',
          render: (_, article) => (article.tags.length > 0
            ? article.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
            : <Typography.Text type="secondary">—</Typography.Text>),
        },
        { title: 'Phiên bản', key: 'version', onHeaderCell: oneLine, onCell: oneLine, render: (_, article) => `v${article.version}` },
        { title: 'Tác giả', key: 'author', onCell: oneLine, render: (_, article) => (isArticleAuthor(user, article) ? 'Bạn' : 'Người khác') },
        { title: 'Cập nhật', key: 'updated', align: 'right', onCell: oneLine, render: (_, article) => formatArticleDate(article.updatedAt) },
        {
          title: 'Thao tác',
          key: 'actions',
          align: 'right',
          onCell: oneLine,
          render: (_, article) => (
            <Space size={12} align="start">
              {canEditArticle(user, article) && (
                <Link to={editArticlePath(article.id)} state={listState} aria-label={`Sửa bài ${article.title}`} style={{ lineHeight: '24px' }}>
                  <EditOutlined /> Sửa
                </Link>
              )}
              {/* The row's revision: a list older than the article is refused (409) and offers a reload. */}
              <ArticleLifecycleActions article={article} expectedRevision={article.revision} onReload={onReload} size="small" />
            </Space>
          ),
        },
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
