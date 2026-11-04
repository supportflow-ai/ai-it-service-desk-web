import { Alert, Button, Card, Divider, Space, Tag, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useArticle } from '../hooks/useArticle';
import { isArticleAccessLost } from '../lib/articleErrorMessage';
import { formatArticleDate } from '../lib/formatArticleDate';
import { editArticlePath, knowledgeListPath, listStateFrom } from '../lib/knowledgePaths';
import { isArticleId } from '../model/articleId';
import { ArticleStatus } from '../model/knowledge.types';
import type { ArticleDto } from '../model/knowledge.types';
import { canEditArticle, isArticleAuthor } from '../model/knowledgePermissions';
import { ArticleLifecycleActions } from '../components/ArticleLifecycleActions';
import { ArticlePageHeader } from '../components/ArticlePageHeader';
import { ArticleStatusTag } from '../components/ArticleStatusTag';
import { ArticleUnavailable } from '../components/ArticleUnavailable';
import { MarkdownPreview } from '../components/MarkdownPreview';

const statusNotes: Partial<Record<ArticleStatus, string>> = {
  [ArticleStatus.Draft]: 'Bản nháp: người dùng chưa đọc được bài này cho tới khi xuất bản.',
  [ArticleStatus.Archived]: 'Đã lưu trữ: người dùng không còn thấy bài này.',
};

function metaLine(article: ArticleDto, author: string) {
  return [
    `Tác giả: ${author}`,
    `Tạo lúc ${formatArticleDate(article.createdAt)}`,
    `Cập nhật ${formatArticleDate(article.updatedAt)}`,
    article.publishedAt && `Xuất bản ${formatArticleDate(article.publishedAt)}`,
    article.archivedAt && `Lưu trữ ${formatArticleDate(article.archivedAt)}`,
  ].filter(Boolean).join(' · ');
}

/** One article as staff read it (TC-341), with the edit and lifecycle actions the user may take. */
export function ArticleDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const article = useArticle(id ?? '');
  const reload = () => { void article.refetch(); };
  const listPath = knowledgeListPath(location.state);

  if (!isArticleId(id)) return <ArticleUnavailable error={null} backPath={listPath} onRetry={reload} />;
  if (article.isPending) return <PageLoader />;
  if (!article.data || isArticleAccessLost(article.error)) {
    return <ArticleUnavailable error={article.error} backPath={listPath} onRetry={reload} />;
  }

  const data = article.data;
  const note = statusNotes[data.status];
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <ArticlePageHeader
        title={data.title}
        backPath={listPath}
        backLabel="Quay lại danh sách"
        extra={(
          <>
            {canEditArticle(user, data) && (
              <Button icon={<EditOutlined />} onClick={() => navigate(editArticlePath(data.id), { state: listStateFrom(location.state) })}>
                Sửa
              </Button>
            )}
            <ArticleLifecycleActions article={data} expectedRevision={data.revision} onReload={reload} />
          </>
        )}
      />

      {/* A failed refetch keeps the article last read, with a way to try again. */}
      {article.error && <div style={{ marginBottom: 16 }}><ErrorState error={article.error} onRetry={reload} /></div>}

      <Card style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
        <Space wrap size={8} style={{ marginBottom: 8 }}>
          <ArticleStatusTag status={data.status} />
          <span className="meta">v{data.version}</span>
          {data.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
        </Space>
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
          {metaLine(data, isArticleAuthor(user, data) ? 'Bạn' : 'Người khác')}
        </Typography.Paragraph>
        {note && <Alert type="info" showIcon message={note} style={{ marginTop: 12 }} />}
        <Divider />
        <MarkdownPreview markdown={data.content} />
      </Card>
    </div>
  );
}
