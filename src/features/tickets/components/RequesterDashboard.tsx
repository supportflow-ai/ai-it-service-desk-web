import { Alert, Button, Card, Col, Empty, Input, Row, Skeleton, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useTickets } from '../hooks/useTickets';
import { TicketStatusTag } from './TicketStatusTag';
import { TicketStatus } from '../model/ticket.types';
import type { TicketDto } from '../model/ticket.types';
import { isTerminalStatus } from '../model/ticketStatus';

const { Title, Text } = Typography;

// The largest page GET /tickets/me accepts: the counts cover at most this many recent tickets.
const COUNTED_TICKETS = 100;
const RECENT_TICKETS = 5;

/**
 * Three disjoint groups. "Waiting for you" (PendingUser) is not one of them: the backend has no
 * request-information step yet, so such a ticket never exists and the card would always read 0.
 */
function countByStatus(tickets: readonly TicketDto[]) {
  const resolved = (t: TicketDto) => t.status === TicketStatus.Resolved || t.status === TicketStatus.Closed;
  return {
    waiting: tickets.filter((t) => t.status === TicketStatus.Submitted).length,
    inProgress: tickets.filter((t) => t.status !== TicketStatus.Submitted && !isTerminalStatus(t.status) && !resolved(t)).length,
    resolved: tickets.filter(resolved).length,
  };
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Card bordered style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: 'var(--tx2)', fontSize: 13, marginTop: 4 }}>{label}</div>
    </Card>
  );
}

/** Only the signed-in account's own tickets are shown; nothing is filled in while they load or fail. */
export function RequesterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ticketsQuery = useTickets(1, COUNTED_TICKETS);

  const now = new Date();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dateFormatted = `${daysOfWeek[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const tickets = ticketsQuery.data?.items ?? [];
  const totalCount = ticketsQuery.data?.totalCount ?? 0;
  const counts = countByStatus(tickets);
  const recent = tickets.slice(0, RECENT_TICKETS);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: 'var(--tx)' }}>
            Xin chào, {user?.fullName ?? user?.email ?? 'Bạn'}
          </Title>
          <Text style={{ color: 'var(--tx2)', fontSize: 13 }}>
            {dateFormatted}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/tickets/new')}
          style={{ borderRadius: 6, fontWeight: 500 }}
        >
          Tạo yêu cầu
        </Button>
      </div>

      {ticketsQuery.error && (
        <div style={{ marginBottom: 16 }}>
          <ErrorState error={ticketsQuery.error} onRetry={() => { void ticketsQuery.refetch(); }} />
        </div>
      )}

      {/* Stats Cards */}
      {ticketsQuery.isPending ? (
        <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 28 }} />
      ) : ticketsQuery.data && (
        <div style={{ marginBottom: 28 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}><StatCard value={counts.waiting} label="Chờ tiếp nhận" color="var(--tx)" /></Col>
            <Col xs={24} sm={8}><StatCard value={counts.inProgress} label="Đang được xử lý" color="var(--in)" /></Col>
            <Col xs={24} sm={8}><StatCard value={counts.resolved} label="Đã giải quyết gần đây" color="var(--ok)" /></Col>
          </Row>
          {totalCount > tickets.length && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Tính trên {tickets.length} yêu cầu gần nhất trong tổng số {totalCount}.
            </Text>
          )}
        </div>
      )}

      {/* 2 Columns: Recent Tickets & Knowledge Base */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              Yêu cầu gần đây
            </Title>
            <Button type="link" onClick={() => navigate('/requester-dashboard/tickets')} style={{ padding: 0 }}>
              Xem tất cả
            </Button>
          </div>

          <Card
            bordered
            bodyStyle={{ padding: recent.length > 0 ? 0 : undefined }}
            style={{ borderRadius: 8, borderColor: 'var(--bd)', overflow: 'hidden' }}
          >
            {ticketsQuery.isPending && <Skeleton active paragraph={{ rows: 4 }} />}

            {ticketsQuery.data && recent.length === 0 && (
              <Empty description="Bạn chưa có yêu cầu nào." image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tickets/new')}>
                  Tạo yêu cầu đầu tiên
                </Button>
              </Empty>
            )}

            {recent.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--sf2)', borderBottom: '1px solid var(--bd2)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Mã</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Tiêu đề</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Trạng thái</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--tx2)' }}>Tạo lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/requester-dashboard/tickets/${t.id}`)}
                      style={{ borderBottom: '1px solid var(--bd)', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '12px 14px' }} className="mono">
                        {t.ticketNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--tx)' }}>
                        {t.title}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <TicketStatusTag status={t.status} />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--tx3)' }}>
                        {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </Col>

        {/* Right Column: Knowledge Base */}
        <Col xs={24} lg={9}>
          <div style={{ marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              Kho tri thức
            </Title>
          </div>

          {/* No knowledge base endpoint exists yet: no articles are shown and search stays locked. */}
          <Card bordered style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
            <Input
              disabled
              aria-label="Tìm bài viết (chưa hỗ trợ)"
              prefix={<SearchOutlined style={{ color: 'var(--tx3)' }} />}
              placeholder="Tìm bài viết hướng dẫn…"
              style={{ borderRadius: 6, marginBottom: 16 }}
            />
            <Alert type="info" showIcon message="Kho tri thức chưa được hỗ trợ: hệ thống chưa có bài viết hướng dẫn." />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
