import { useState } from 'react';
import { Alert, Button, Card, Input, Space, Typography } from 'antd';
import { useAuth } from '@/features/auth';
import { useAddComment } from '../hooks/useAddComment';
import { useAddInternalNote } from '../hooks/useAddInternalNote';
import type { TicketStatus } from '../model/ticket.types';
import { canAddPublicComment, canSeeInternalNotes } from '../model/ticketPermissions';
import type { TicketView } from '../model/ticketPermissions';
import { describeTicketError } from '../lib/ticketErrorMessage';
import { COMMENT_MAX_LENGTH, canSendComment, validateCommentContent } from '../validation/commentRules';

interface TicketCommentComposerProps {
  ticketId: string;
  status: TicketStatus;
  /** Internal notes are written only from the workspace (PRD UX-05), never from the requester screen. */
  view: TicketView;
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

export function TicketCommentComposer({ ticketId, status, view }: TicketCommentComposerProps) {
  const { user } = useAuth();
  const allowInternal = canSeeInternalNotes(user, view);
  const allowPublic = canAddPublicComment({ status });
  const [selectedTab, setSelectedTab] = useState<ComposerTab>('public');
  const [content, setContent] = useState('');

  const addCommentMutation = useAddComment(ticketId);
  const addInternalNoteMutation = useAddInternalNote(ticketId);

  // A requester can never end up on the internal tab, even if the role changes mid-session; an
  // ended ticket only takes internal notes.
  const activeTab: ComposerTab = !allowInternal ? 'public' : !allowPublic ? 'internal' : selectedTab;
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

  if (!allowPublic && !allowInternal) {
    return (
      <Card title="Soạn phản hồi" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
        <Typography.Text type="secondary">Yêu cầu đã kết thúc nên không thể gửi thêm phản hồi.</Typography.Text>
      </Card>
    );
  }

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
            disabled={!allowPublic}
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
      {!allowPublic && (
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
          Ticket đã kết thúc: không gửi được phản hồi công khai, chỉ còn ghi chú nội bộ.
        </Typography.Text>
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
          activeTab === 'internal'
            ? 'Ghi chú chỉ hiển thị với các kỹ thuật viên IT'
            : view === 'requester'
              ? 'Phản hồi này đội hỗ trợ IT sẽ nhìn thấy'
              : 'Phản hồi này người yêu cầu sẽ nhìn thấy'
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
