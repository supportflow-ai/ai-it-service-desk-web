import { Card, Empty, Skeleton, Space } from 'antd';
import { useAuth } from '@/features/auth';
import { normalizeError } from '@/shared/api/httpError';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useTicketTimeline } from '../hooks/useTicketTimeline';
import { canAddInternalNote } from '../model/ticketPermissions';
import { timelineAuthorLabel, timelineRoleLabel, visibleTimelineItems } from '../model/timeline';

interface TicketTimelineProps {
  ticketId: string;
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString('vi-VN')}`;
}

export function TicketTimeline({ ticketId }: TicketTimelineProps) {
  const { user } = useAuth();
  const timeline = useTicketTimeline(ticketId);
  const status = timeline.error ? normalizeError(timeline.error).status : undefined;
  // 403/404 means the data is no longer ours to show, even if an older copy is cached.
  const accessLost = status === 403 || status === 404;
  const items = timeline.data && !accessLost
    ? visibleTimelineItems(timeline.data, canAddInternalNote(user))
    : [];

  return (
    <Card
      title="Hoạt động & Trao đổi"
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {timeline.error && (
        <div style={{ marginBottom: 12 }}>
          <ErrorState error={timeline.error} onRetry={() => { void timeline.refetch(); }} />
        </div>
      )}

      {timeline.isPending && <Skeleton active paragraph={{ rows: 3 }} />}

      {!timeline.isPending && !timeline.error && items.length === 0 && (
        <Empty
          description="Chưa có trao đổi nào cho ticket này."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {items.length > 0 && (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {items.map((item) => {
            const author = timelineAuthorLabel(item, user?.userId);
            const role = timelineRoleLabel(item.authorRole);
            const byline = author === role ? author : `${author} · ${role}`;
            if (item.isInternal) {
              return (
                <div className="msg-card note" key={item.id} data-testid="timeline-internal-note">
                  <header>
                    <span style={{ fontWeight: 600, color: 'var(--wn)' }}>
                      Ghi chú nội bộ · {byline}
                    </span>
                    <span className="meta">{formatDate(item.createdAt)}</span>
                  </header>
                  <div style={{ fontSize: 13, color: 'var(--tx)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </div>
                </div>
              );
            }

            return (
              <div className="msg-card" key={item.id}>
                <header>
                  <span style={{ fontWeight: 600 }}>{byline}</span>
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
