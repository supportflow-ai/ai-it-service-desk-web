import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd';
import { CloudUploadOutlined, InboxOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import type { ArticleDto } from '../model/knowledge.types';
import { canArchiveArticle, canPublishArticle } from '../model/knowledgePermissions';
import { useArchiveArticle, usePublishArticle } from '../hooks/useArticleWrite';
import { useArticleWritePending } from '../hooks/useArticleWritePending';
import { describeArticleError } from '../lib/articleErrorMessage';

interface ArticleLifecycleActionsProps {
  article: ArticleDto;
  /** The revision the caller shows: a change made meanwhile is refused (409), never overwritten. */
  expectedRevision: number;
  onReload: () => void;
  onPublished?: (article: ArticleDto) => void;
  /** Why publishing is held back right now, e.g. unsaved changes; null when it is allowed. */
  publishBlockedReason?: string | null;
  size?: 'small' | 'middle';
}

const lifecycleMessages = {
  403: 'Chỉ tác giả hoặc Admin được xuất bản hay lưu trữ bài viết này.',
};

/** Publish (Draft → Published) and archive (Published → Archived), each confirmed first (TC-340). */
export function ArticleLifecycleActions({
  article, expectedRevision, onReload, onPublished, publishBlockedReason = null, size = 'middle',
}: ArticleLifecycleActionsProps) {
  const { user } = useAuth();
  const publish = usePublishArticle(article.id);
  const archive = useArchiveArticle(article.id);
  const pending = useArticleWritePending(article.id);
  const failedWith = publish.isError ? publish.error : archive.isError ? archive.error : null;
  const failure = failedWith ? describeArticleError(failedWith, lifecycleMessages) : null;
  const allowPublish = canPublishArticle(user, article);
  const allowArchive = canArchiveArticle(user, article);
  if (!allowPublish && !allowArchive) return null;

  // Only the latest action's outcome is shown, so the other one's error is cleared first.
  const runPublish = () => {
    archive.reset();
    // mutateAsync, not mutate callbacks: the editor holding this button unmounts as soon as the
    // article reads Published, and the caller's follow-up (leaving the editor) must still run.
    publish.mutateAsync(expectedRevision).then((saved) => onPublished?.(saved), () => { /* Shown from the mutation state. */ });
  };
  const runArchive = () => {
    publish.reset();
    archive.mutate(expectedRevision);
  };
  const reload = () => {
    publish.reset();
    archive.reset();
    onReload();
  };

  const publishButton = (
    <Button
      type="primary"
      size={size}
      icon={<CloudUploadOutlined />}
      loading={publish.isPending}
      disabled={pending || publishBlockedReason !== null}
      style={{ borderRadius: 6 }}
    >
      Xuất bản
    </Button>
  );

  return (
    <Space direction="vertical" size={4} style={{ alignItems: 'flex-end' }}>
      <Space wrap>
        {allowPublish && (publishBlockedReason !== null
          ? <Tooltip title={publishBlockedReason}>{publishButton}</Tooltip>
          : (
            <Popconfirm
              title="Xuất bản bài viết này?"
              description="Người dùng sẽ đọc được ngay. Sau khi xuất bản, bài viết không sửa được nữa."
              okText="Xác nhận xuất bản"
              cancelText="Không"
              onConfirm={runPublish}
            >
              {publishButton}
            </Popconfirm>
          ))}
        {allowArchive && (
          <Popconfirm
            title="Lưu trữ bài viết này?"
            description="Bài viết sẽ không còn hiện với người dùng và không khôi phục được."
            okText="Xác nhận lưu trữ"
            cancelText="Không"
            onConfirm={runArchive}
          >
            <Button size={size} icon={<InboxOutlined />} loading={archive.isPending} disabled={pending} style={{ borderRadius: 6 }}>
              Lưu trữ
            </Button>
          </Popconfirm>
        )}
      </Space>
      {failure && (
        <Typography.Text type="danger" role="alert" style={{ fontSize: 12, maxWidth: 360, textAlign: 'right' }}>
          {failure.message}{' '}
          {failure.reloadable && <Button type="link" size="small" onClick={reload} style={{ padding: 0, height: 'auto' }}>Tải lại</Button>}
        </Typography.Text>
      )}
    </Space>
  );
}
