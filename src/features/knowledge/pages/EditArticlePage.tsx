import { useEffect, useRef } from 'react';
import { Result } from 'antd';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { isRecord } from '@/shared/lib/guards';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useArticle } from '../hooks/useArticle';
import { isArticleAccessLost } from '../lib/articleErrorMessage';
import { articlePath, knowledgeListPath, listStateFrom } from '../lib/knowledgePaths';
import { isArticleId } from '../model/articleId';
import { ArticleStatus } from '../model/knowledge.types';
import { canEditArticle } from '../model/knowledgePermissions';
import { ArticleDraftEditor } from '../components/ArticleDraftEditor';
import { ArticlePageHeader } from '../components/ArticlePageHeader';
import { ArticleStatusTag } from '../components/ArticleStatusTag';
import { ArticleUnavailable } from '../components/ArticleUnavailable';

function createdAtOf(state: unknown) {
  return isRecord(state) && typeof state.createdAt === 'string' ? state.createdAt : null;
}

/** Edit a Draft (TC-338): its author or an Admin; anything else is explained, not offered. */
export function EditArticlePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const article = useArticle(id ?? '');
  const reload = () => { void article.refetch(); };
  // A publish still finishing after the person left this page must not pull them back to the article.
  const left = useRef(false);
  useEffect(() => {
    left.current = false;
    return () => { left.current = true; };
  }, []);
  const listPath = knowledgeListPath(location.state);

  if (!isArticleId(id)) return <ArticleUnavailable error={null} backPath={listPath} onRetry={reload} />;
  if (article.isPending) return <PageLoader />;
  if (!article.data || isArticleAccessLost(article.error)) {
    return <ArticleUnavailable error={article.error} backPath={listPath} onRetry={reload} />;
  }

  const data = article.data;
  const readPath = articlePath(data.id);
  const listState = listStateFrom(location.state);
  const header = (
    <ArticlePageHeader
      title="Sửa bản nháp"
      backPath={readPath}
      backState={listState}
      backLabel="Quay lại bài viết"
      extra={<><ArticleStatusTag status={data.status} /><span className="meta">v{data.version}</span></>}
    />
  );

  if (!canEditArticle(user, data)) {
    // Published articles cannot be edited at backend dev 1506a5b: there are no new versions (gap G3).
    const reason = data.status !== ArticleStatus.Draft
      ? 'Chỉ sửa được bản nháp. Bài đã xuất bản hoặc đã lưu trữ thì không sửa được nữa.'
      : 'Chỉ tác giả hoặc Admin được sửa bản nháp này.';
    return (
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {header}
        <Result status="info" title="Không sửa được bài viết này" subTitle={reason} extra={<Link to={readPath} state={listState}>Xem bài viết</Link>} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {header}
      <ArticleDraftEditor
        key={data.id}
        article={data}
        onReload={reload}
        onCancel={() => navigate(readPath, { state: listState })}
        // A published article cannot be edited, so editing ends on the article as readers now see it.
        onPublished={() => { if (!left.current) navigate(readPath, { replace: true, state: listState }); }}
        createdAt={createdAtOf(location.state)}
      />
    </div>
  );
}
