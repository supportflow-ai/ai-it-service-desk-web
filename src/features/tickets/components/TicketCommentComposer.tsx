import { useState } from 'react';
import { Alert, Button, Card, Input, Space } from 'antd';
import { useAuth } from '@/features/auth';
import { useAddComment } from '../hooks/useAddComment';
import { useAddInternalNote } from '../hooks/useAddInternalNote';
import { canAddInternalNote } from '../model/ticketPermissions';

interface TicketCommentComposerProps {
  ticketId: string;
}

export function TicketCommentComposer({ ticketId }: TicketCommentComposerProps) {
  const { user } = useAuth();
  const allowInternal = canAddInternalNote(user);
  const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');
  const [content, setContent] = useState('');

  const addCommentMutation = useAddComment(ticketId);
  const addInternalNoteMutation = useAddInternalNote(ticketId);

  const isPending = addCommentMutation.isPending || addInternalNoteMutation.isPending;
  const error = addCommentMutation.error || addInternalNoteMutation.error;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    if (activeTab === 'public') {
      await addCommentMutation.mutateAsync({ ticketId, content: trimmed });
    } else {
      await addInternalNoteMutation.mutateAsync({ ticketId, content: trimmed });
    }
    setContent('');
  };

  return (
    <Card
      title="Soạn phản hồi"
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {error && (
        <Alert
          type="error"
          showIcon
          message="Gửi phản hồi thất bại, vui lòng thử lại."
          style={{ marginBottom: 12 }}
        />
      )}

      {allowInternal && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 10 }}>
          <Button
            type="text"
            onClick={() => setActiveTab('public')}
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'public' ? '2px solid var(--pr)' : '2px solid transparent',
              color: activeTab === 'public' ? 'var(--pr)' : 'var(--tx2)',
              fontWeight: 600,
              padding: '6px 14px',
              height: 'auto',
            }}
          >
            Phản hồi công khai
          </Button>
          <Button
            type="text"
            onClick={() => setActiveTab('internal')}
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'internal' ? '2px solid var(--pr)' : '2px solid transparent',
              color: activeTab === 'internal' ? 'var(--pr)' : 'var(--tx2)',
              fontWeight: 600,
              padding: '6px 14px',
              height: 'auto',
            }}
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
        placeholder={
          activeTab === 'public'
            ? 'Phản hồi này người yêu cầu sẽ nhìn thấy'
            : 'Ghi chú chỉ hiển thị với các kỹ thuật viên IT'
        }
        style={{ borderRadius: 6, marginBottom: 12 }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Space>
          {activeTab === 'internal' ? (
            <Button
              type="primary"
              loading={isPending}
              disabled={!content.trim()}
              onClick={handleSubmit}
              style={{ borderRadius: 6, background: '#85590E', borderColor: '#85590E' }}
            >
              Lưu ghi chú nội bộ
            </Button>
          ) : (
            <Button
              type="primary"
              loading={isPending}
              disabled={!content.trim()}
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
