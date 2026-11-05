import { useCallback, useEffect, useRef } from 'react';
import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';
import { useArticle } from '../hooks/useArticle';
import { isArticleAccessLost } from '../lib/articleErrorMessage';
import { formatArticleDate } from '../lib/formatArticleDate';
import { KNOWLEDGE_PATH, articlePath, knowledgeResultsPath, knowledgeTagPath, sourceSectionFrom } from '../lib/knowledgePaths';
import { isArticleId } from '../model/articleId';
import { articleSections, sameSection } from '../model/articleSections';
import { ArticleStatus } from '../model/knowledge.types';
import type { ArticleDto } from '../model/knowledge.types';
import { canManageKnowledge } from '../model/knowledgePermissions';
import { ArticleUnavailable } from '../components/ArticleUnavailable';
import { MarkdownPreview } from '../components/MarkdownPreview';

interface PublishedArticlePageProps {
  /** Where a reader the article did not help asks for help; the app passes the create-request route. */
  helpPath: string;
}

function sourceNote(section: string | null, found: boolean) {
  if (section === null) return 'Đoạn khớp với câu hỏi nằm ở phần mở đầu bài viết.';
  return found
    ? `Đoạn khớp với câu hỏi nằm ở mục “${section}”.`
    : `Mục “${section}” không còn trong phiên bản hiện tại của bài; bên dưới là toàn bộ bài viết.`;
}

function versionLine(article: ArticleDto) {
  const published = formatArticleDate(article.publishedAt ?? article.updatedAt);
  const updated = formatArticleDate(article.updatedAt);
  return [`Phiên bản ${article.version}`, `Xuất bản ${published}`, updated !== published && `Cập nhật ${updated}`]
    .filter(Boolean).join(' · ');
}

/**
 * A Published article as readers see it (TC-343), with its tags, version and the way back. Opened
 * from a semantic result, it shows the section the passage came from (TC-362).
 */
export function PublishedArticlePage({ helpPath }: PublishedArticlePageProps) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const article = useArticle(id ?? '');
  const reload = () => { void article.refetch(); };
  const backPath = knowledgeResultsPath(location.state);
  const backLabel = backPath === KNOWLEDGE_PATH ? 'Về Kho tri thức' : 'Quay lại kết quả tìm kiếm';
  const section = sourceSectionFrom(location.state);
  const body = useRef<HTMLDivElement>(null);
  const content = article.data?.content;
  // Checked on the source, so a section the article no longer has is said so instead of searched for.
  const sectionFound = typeof section === 'string' && content !== undefined
    && articleSections(content).some((heading) => sameSection(heading, section));
  const showSection = useCallback(() => {
    if (typeof section !== 'string') return;
    const headings = body.current?.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6') ?? [];
    const heading = [...headings].find((element) => sameSection(element.textContent ?? '', section));
    if (!heading) return;
    heading.classList.add('kb-source-section');
    heading.tabIndex = -1;
    heading.scrollIntoView({ block: 'start' });
    heading.focus({ preventScroll: true });
  }, [section]);
  useEffect(() => {
    if (sectionFound) showSection();
  }, [sectionFound, showSection]);

  const unavailable = (error: unknown) => (
    <ArticleUnavailable error={error} backPath={backPath} backLabel={backLabel} onRetry={reload} />
  );

  if (!isArticleId(id)) return unavailable(null);
  if (article.isPending) return <PageLoader />;
  if (!article.data || isArticleAccessLost(article.error)) return unavailable(article.error);

  const data = article.data;
  // Only Published articles are read here (FR-KB-02, PR-14). Staff are also served their drafts,
  // and an Admin archived ones: those open where they are managed. Anyone else gets the same
  // not-found page as for a missing article (UX-04).
  if (data.status !== ArticleStatus.Published) {
    return canManageKnowledge(user) ? <Navigate to={articlePath(data.id)} replace /> : unavailable(null);
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Link to={backPath} style={{ fontWeight: 500 }}><ArrowLeftOutlined /> {backLabel}</Link>

      {/* A failed refresh keeps the article last read, with a way to try again. */}
      {article.error && <div style={{ marginTop: 12 }}><ErrorState error={article.error} onRetry={reload} /></div>}

      <article aria-labelledby="kb-article-title" style={{ marginTop: 12 }}>
        <Typography.Title id="kb-article-title" level={2} style={{ margin: 0, fontWeight: 700 }}>{data.title}</Typography.Title>
        <Space wrap size={[6, 6]} style={{ margin: '8px 0 4px' }}>
          {data.tags.map((tag) => (
            <Link key={tag} to={knowledgeTagPath(tag)} aria-label={`Bài viết cùng tag ${tag}`}><Tag style={{ margin: 0 }}>{tag}</Tag></Link>
          ))}
        </Space>
        <div className="meta">{versionLine(data)}</div>
        {section !== undefined && (
          <Alert
            type={section === null || sectionFound ? 'info' : 'warning'}
            showIcon
            style={{ marginTop: 12 }}
            message={sourceNote(section, sectionFound)}
            action={sectionFound ? <Button size="small" onClick={showSection}>Tới mục này</Button> : undefined}
          />
        )}
        <Card style={{ borderRadius: 8, borderColor: 'var(--bd)', marginTop: 16 }}>
          <div ref={body}><MarkdownPreview markdown={data.content} /></div>
        </Card>
      </article>

      {/* PRD J-03: a reader the article did not help goes on to a request. */}
      <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Typography.Text>Bài viết chưa giải quyết được vấn đề của bạn?</Typography.Text>
          <Button type="primary" onClick={() => navigate(helpPath)}>Tạo yêu cầu hỗ trợ</Button>
        </div>
      </Card>

      {canManageKnowledge(user) && (
        <div style={{ marginTop: 12 }}><Link to={articlePath(data.id)}>Mở bài viết trong trang quản lý</Link></div>
      )}
    </div>
  );
}
