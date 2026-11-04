import { useState } from 'react';
import { Alert, Button, Card, Form } from 'antd';
import type { ArticleDraftPayload, ArticleDto } from '../model/knowledge.types';
import { useUpdateDraft } from '../hooks/useArticleWrite';
import { useArticleWritePending } from '../hooks/useArticleWritePending';
import { useUnsavedChangesPrompt } from '../hooks/useUnsavedChangesPrompt';
import { describeArticleError } from '../lib/articleErrorMessage';
import { normalizeTags } from '../validation/articleRules';
import { ArticleEditorForm } from './ArticleEditorForm';
import { ArticleLifecycleActions } from './ArticleLifecycleActions';

interface ArticleDraftEditorProps {
  article: ArticleDto;
  onReload: () => void;
  onCancel: () => void;
  onPublished: (article: ArticleDto) => void;
  /** When the draft was created, for the screen opened right after creating it. */
  createdAt?: string | null;
}

const editMessages = {
  403: 'Chỉ tác giả hoặc Admin được sửa bản nháp này.',
  422: 'Bài viết không còn là bản nháp, có thể vừa được xuất bản, nên không sửa được nữa. Hãy tải lại để xem trạng thái mới nhất.',
};

const snapshot = (source: ArticleDto): ArticleDraftPayload => ({ title: source.title, content: source.content, tags: source.tags });

function sameContent(values: { title?: string; content?: string; tags?: string[] }, saved: ArticleDraftPayload) {
  const sameTags = normalizeTags(values.tags ?? []).join(',') === saved.tags.join(',');
  return (values.title ?? '').trim() === saved.title && (values.content ?? '').trim() === saved.content && sameTags;
}

function timeOf(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Mount with key={article.id}: the form starts from the article as loaded. A save carries the
 * revision that content is based on, so a change made meanwhile is refused (409) instead of
 * overwritten; a background refetch never moves that revision, only this user's own save or the
 * reload they ask for after a conflict does. Typed changes stay through that reload.
 */
export function ArticleDraftEditor({ article, onReload, onCancel, onPublished, createdAt = null }: ArticleDraftEditorProps) {
  const [form] = Form.useForm<ArticleDraftPayload>();
  const update = useUpdateDraft(article.id);
  const writing = useArticleWritePending(article.id);
  // `saved` is the server copy the form is based on: its revision goes with every write, and
  // publishing waits until the form matches it, since only saved content can be published.
  const [base, setBase] = useState({ revision: article.revision, saved: snapshot(article), adoptReloaded: false });
  if (base.adoptReloaded && article.revision !== base.revision) {
    setBase({ revision: article.revision, saved: snapshot(article), adoptReloaded: false });
  }
  const values = {
    title: Form.useWatch('title', form),
    content: Form.useWatch('content', form),
    tags: Form.useWatch('tags', form),
  };
  const unsaved = !sameContent(values, base.saved);
  useUnsavedChangesPrompt(unsaved);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const failure = update.isError ? describeArticleError(update.error, editMessages) : null;

  const save = (payload: ArticleDraftPayload) => {
    setBase((value) => ({ ...value, adoptReloaded: false }));
    update.mutate({ payload, expectedRevision: base.revision }, {
      onSuccess: (saved) => {
        setBase({ revision: saved.revision, saved: snapshot(saved), adoptReloaded: false });
        setSavedAt(saved.updatedAt);
      },
    });
  };
  const reload = () => {
    update.reset();
    setBase((value) => ({ ...value, adoptReloaded: true }));
    onReload();
  };

  const status = savedAt ? `Đã lưu bản nháp lúc ${timeOf(savedAt)}.`
    : createdAt ? `Đã tạo bản nháp lúc ${timeOf(createdAt)}.` : null;

  return (
    <Card style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure.message}
          action={failure.reloadable ? <Button size="small" onClick={reload}>Tải lại</Button> : undefined}
          style={{ marginBottom: 16 }}
        />
      )}
      <ArticleEditorForm
        form={form}
        initialValues={{ title: article.title, content: article.content, tags: article.tags }}
        pending={update.isPending || writing}
        onSubmit={save}
        onCancel={onCancel}
        status={status}
        actions={(
          <ArticleLifecycleActions
            article={article}
            expectedRevision={base.revision}
            onReload={reload}
            onPublished={onPublished}
            publishBlockedReason={unsaved ? 'Lưu nháp trước khi xuất bản: chỉ nội dung đã lưu mới được xuất bản.' : null}
          />
        )}
      />
    </Card>
  );
}
