import { Alert, Card, Form } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCreateArticle } from '../hooks/useArticleWrite';
import { useUnsavedChangesPrompt } from '../hooks/useUnsavedChangesPrompt';
import { describeArticleError } from '../lib/articleErrorMessage';
import { editArticlePath, knowledgeListPath, listStateFrom } from '../lib/knowledgePaths';
import type { ArticleDraftPayload } from '../model/knowledge.types';
import { ArticleEditorForm } from '../components/ArticleEditorForm';
import { ArticlePageHeader } from '../components/ArticlePageHeader';

const emptyDraft: ArticleDraftPayload = { title: '', content: '', tags: [] };

/** A new Draft authored by the signed-in Agent or Admin (TC-338); it then opens for editing. */
export function NewArticlePage() {
  const [form] = Form.useForm<ArticleDraftPayload>();
  const create = useCreateArticle();
  const navigate = useNavigate();
  const location = useLocation();
  const listPath = knowledgeListPath(location.state);
  const failure = create.isError ? describeArticleError(create.error) : null;
  const title = Form.useWatch('title', form);
  const content = Form.useWatch('content', form);
  const tags = Form.useWatch('tags', form);
  const typed = !!title?.trim() || !!content?.trim() || (tags?.length ?? 0) > 0;
  useUnsavedChangesPrompt(typed && !create.isSuccess);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <ArticlePageHeader title="Viết bài mới" backPath={listPath} backLabel="Quay lại danh sách" />
      <Card style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
        {failure && <Alert type="error" showIcon message={failure.message} style={{ marginBottom: 16 }} />}
        <ArticleEditorForm
          form={form}
          initialValues={emptyDraft}
          pending={create.isPending}
          // The draft now exists: further saves update it, with its revision, from its own page.
          onSubmit={(payload) => create.mutate(payload, {
            onSuccess: (article) => navigate(editArticlePath(article.id), { replace: true, state: { ...listStateFrom(location.state), createdAt: article.createdAt } }),
          })}
          onCancel={() => navigate(listPath)}
        />
      </Card>
    </div>
  );
}
