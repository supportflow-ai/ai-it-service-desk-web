import { useState } from 'react';
import { Alert, Button, Card, Input, Space, Typography } from 'antd';
import { useAuth } from '@/features/auth';
import { useAddComment } from '../hooks/useAddComment';
import { useAddInternalNote } from '../hooks/useAddInternalNote';
import { canAddInternalNote } from '../model/ticketPermissions';
import { describeTicketError } from '../lib/ticketErrorMessage';
import { COMMENT_MAX_LENGTH, canSendComment, validateCommentContent } from '../validation/commentRules';

interface TicketCommentComposerProps {
  ticketId: string;
}

type ComposerTab = 'public' | 'internal';

const composerMessages = {
  400: 'Nội dung chưa hợp lệ. Vui lòng nhập từ 2 đến 4000 ký tự.',
};

function tabStyle(active: boolean) {
  return {
    borderRadius: 0,
    borderBottom: active ? '2px solid var(--pr)' : '2px solid transparent',
    color: active ? 'var(--pr)' : 'var(--tx2)',
    fontWeight: 600,
    padding: '6px 14px',
    height: 'auto',
  };
}

export function TicketCommentComposer({ ticketId }: TicketCommentComposerProps) {
  const { user } = useAuth();
  const allowInternal = canAddInternalNote(user);
  const [selectedTab, setSelectedTab] = useState<ComposerTab>('public');
  const [content, setContent] = useState('');

  const addCommentMutation = useAddComment(ticketId);
  const addInternalNoteMutation = useAddInternalNote(ticketId);

  // A requester can never end up on the internal tab, even if the role changes mid-session.
  const activeTab: ComposerTab = allowInternal ? selectedTab : 'public';
  const activeMutation = activeTab === 'public' ? addCommentMutation : addInternalNoteMutation;
  const isPending = addCommentMutation.isPending || addInternalNoteMutation.isPending;
  const failure = activeMutation.isError ? describeTicketError(activeMutation.error, composerMessages) : null;
  const validationMessage = validateCommentContent(content);

  const switchTab = (tab: ComposerTab) => {
    addCommentMutation.reset();
    addInternalNoteMutation.reset();
    setSelectedTab(tab);
  };

  const handleSubmit = () => {
    if (!canSendComment(content) || isPending) return;
    // Input is kept on failure so the user can retry without retyping.
    activeMutation.mutate({ ticketId, content: content.trim() }, { onSuccess: () => setContent('') });
  };

  return (
    <Card
      title="Soạn phản hồi"
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure.message}
          style={{ marginBottom: 12 }}
        />
      )}

      {allowInternal && (
        <div role="group" aria-label="Loại phản hồi" style={{ display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 10 }}>
          <Button
            type="text"
            aria-pressed={activeTab === 'public'}
            onClick={() => switchTab('public')}
            style={tabStyle(activeTab === 'public')}
          >
            Phản hồi công khai
          </Button>
          <Button
            type="text"
            aria-pressed={activeTab === 'internal'}
            onClick={() => switchTab('internal')}
            style={tabStyle(activeTab === 'internal')}
          >
            Ghi chú nội bộ
          </Button>
        </div>
      )}

      <Input.TextArea
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
        maxLength={COMMENT_MAX_LENGTH}
        showCount
        aria-label={activeTab === 'public' ? 'Nội dung bình luận' : 'Nội dung ghi chú nội bộ'}
        status={validationMessage ? 'error' : undefined}
        placeholder={
          activeTab === 'public'
            ? 'Phản hồi này người yêu cầu sẽ nhìn thấy'
            : 'Ghi chú chỉ hiển thị với các kỹ thuật viên IT'
        }
        style={{ borderRadius: 6 }}
      />
      {validationMessage && (
        <Typography.Text type="danger" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
          {validationMessage}
        </Typography.Text>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 20 }}>
        <Space>
          {activeTab === 'internal' ? (
            <Button
              type="primary"
              loading={isPending}
              disabled={!canSendComment(content)}
              onClick={handleSubmit}
              style={{ borderRadius: 6, background: 'var(--wn)', borderColor: 'var(--wn)' }}
            >
              Lưu ghi chú nội bộ
            </Button>
          ) : (
            <Button
              type="primary"
              loading={isPending}
              disabled={!canSendComment(content)}
              onClick={handleSubmit}
              style={{ borderRadius: 6 }}
            >
              Gửi bình luận
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
}
