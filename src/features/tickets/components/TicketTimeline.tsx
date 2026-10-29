import { Alert, Card, Empty, Skeleton, Space } from 'antd';
import { useTicketTimeline } from '../hooks/useTicketTimeline';

interface TicketTimelineProps {
  ticketId: string;
}

export function TicketTimeline({ ticketId }: TicketTimelineProps) {
  const { data: timelineItems, isPending, error } = useTicketTimeline(ticketId);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString('vi-VN')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <Card
      title="Hoạt động &amp; Trao đổi"
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {error && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải lịch sử trao đổi."
          style={{ marginBottom: 12 }}
        />
      )}

      {isPending && <Skeleton active paragraph={{ rows: 3 }} />}

      {!isPending && !error && (!timelineItems || timelineItems.length === 0) && (
        <Empty
          description="Chưa có trao đổi nào cho ticket này."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {!isPending && timelineItems && timelineItems.length > 0 && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {timelineItems.map((item) => {
            if (item.isInternal) {
              return (
                <div className="msg-card note" key={item.id}>
                  <header>
                    <span style={{ fontWeight: 600, color: '#85590E' }}>
                      Ghi chú nội bộ · {item.authorName} ({item.authorRole})
                    </span>
                    <span className="meta">{formatDate(item.createdAt)}</span>
                  </header>
                  <div style={{ fontSize: 13, color: '#5C3E08', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </div>
                </div>
              );
            }

            return (
              <div className="msg-card" key={item.id}>
                <header>
                  <span style={{ fontWeight: 600 }}>
                    {item.authorName} · {item.authorRole}
                  </span>
                  <span className="meta">{formatDate(item.createdAt)}</span>
                </header>
                <div style={{ fontSize: 13, color: 'var(--tx)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {item.content}
                </div>
              </div>
            );
          })}
        </Space>
      )}
    </Card>
  );
}
