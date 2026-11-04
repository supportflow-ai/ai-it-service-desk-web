import { Alert, Card, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCreateArticle } from '../hooks/useArticleWrite';
import { describeArticleError } from '../lib/articleErrorMessage';
import { KNOWLEDGE_ADMIN_PATH, editArticlePath } from '../lib/knowledgePaths';
import type { ArticleDraftPayload } from '../model/knowledge.types';
import { ArticleEditorForm } from '../components/ArticleEditorForm';
import { ArticlePageHeader } from '../components/ArticlePageHeader';

const emptyDraft: ArticleDraftPayload = { title: '', content: '', tags: [] };

/** A new Draft authored by the signed-in Agent or Admin (TC-338); it then opens for editing. */
export function NewArticlePage() {
  const [form] = Form.useForm<ArticleDraftPayload>();
  const create = useCreateArticle();
  const navigate = useNavigate();
  const failure = create.isError ? describeArticleError(create.error) : null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <ArticlePageHeader title="Viết bài mới" backPath={KNOWLEDGE_ADMIN_PATH} backLabel="Quay lại danh sách" />
      <Card style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
        {failure && <Alert type="error" showIcon message={failure.message} style={{ marginBottom: 16 }} />}
        <ArticleEditorForm
          form={form}
          initialValues={emptyDraft}
          pending={create.isPending}
          // The draft now exists: further saves update it, with its revision, from its own page.
          onSubmit={(payload) => create.mutate(payload, {
            onSuccess: (article) => navigate(editArticlePath(article.id), { replace: true, state: { createdAt: article.createdAt } }),
          })}
          onCancel={() => navigate(KNOWLEDGE_ADMIN_PATH)}
        />
      </Card>
    </div>
  );
}
