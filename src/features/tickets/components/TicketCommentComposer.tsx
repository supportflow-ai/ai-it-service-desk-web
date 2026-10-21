import { useState } from 'react';
import { Button, Card, Input, Space } from 'antd';
import { UnsupportedState } from '@/shared/ui/UnsupportedState';

export function TicketCommentComposer() {
  const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');

  return (
    <Card
      title="Soạn phản hồi"
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      <div style={{ marginBottom: 12 }}>
        <UnsupportedState feature="Bình luận, ghi chú và tệp đính kèm" />
      </div>

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

      <Input.TextArea
        rows={4}
        disabled
        placeholder={activeTab === 'public' ? 'Phản hồi này người yêu cầu sẽ nhìn thấy' : 'Ghi chú chỉ hiển thị với các kỹ thuật viên IT'}
        style={{ borderRadius: 6, marginBottom: 12 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button disabled style={{ borderRadius: 6 }}>
          Đính kèm file
        </Button>

        <Space>
          <Button disabled style={{ borderRadius: 6 }}>
            Lưu ghi chú nội bộ
          </Button>
          <Button type="primary" disabled style={{ borderRadius: 6 }}>
            Gửi bình luận
          </Button>
        </Space>
      </div>
    </Card>
  );
}
