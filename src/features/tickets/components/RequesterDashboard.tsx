import { Button, Card, Col, Input, Row, Space, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useTickets } from '../hooks/useTickets';
import { TicketStatusTag } from './TicketStatusTag';
import { TicketStatus } from '../model/ticket.types';

const { Title, Text } = Typography;

export function RequesterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ticketsQuery = useTickets(1, 5);

  const now = new Date();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dateFormatted = `${daysOfWeek[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  // Lấy dữ liệu ticket từ API nếu có, nếu chưa có thì dùng placeholder items từ mockup
  const realTickets = ticketsQuery.data?.items ?? [];
  const displayTickets = realTickets.length > 0 ? realTickets : [
    {
      id: 'mock-1',
      ticketNumber: 'INC-2026-4892',
      title: 'Không thể kết nối VPN để truy cập tài nguyên nội bộ từ xa',
      status: TicketStatus.PendingUser,
      createdAt: '10 phút trước',
    },
    {
      id: 'mock-2',
      ticketNumber: 'INC-2026-4871',
      title: 'Không nhận được mã OTP Microsoft 365',
      status: TicketStatus.InProgress,
      createdAt: '2 giờ trước',
    },
    {
      id: 'mock-3',
      ticketNumber: 'INC-2026-4850',
      title: 'Yêu cầu cấp quyền GitLab cho dự án Payments',
      status: TicketStatus.Assigned,
      createdAt: 'Hôm qua',
    },
    {
      id: 'mock-4',
      ticketNumber: 'INC-2026-4802',
      title: 'Máy in tầng 4 báo offline',
      status: TicketStatus.Resolved,
      createdAt: '15/10/2026',
    },
  ];

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

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--tx)', lineHeight: 1.1 }}>
              {realTickets.length > 0 ? realTickets.filter((t) => t.status === TicketStatus.InProgress || t.status === TicketStatus.Submitted).length : 3}
            </div>
            <div style={{ color: 'var(--tx2)', fontSize: 13, marginTop: 4 }}>
              Đang mở
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--wn)', lineHeight: 1.1 }}>
              {realTickets.length > 0 ? realTickets.filter((t) => t.status === TicketStatus.PendingUser).length : 1}
            </div>
            <div style={{ color: 'var(--tx2)', fontSize: 13, marginTop: 4 }}>
              Chờ bạn phản hồi
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ok)', lineHeight: 1.1 }}>
              {realTickets.length > 0 ? realTickets.filter((t) => t.status === TicketStatus.Resolved || t.status === TicketStatus.Closed).length : 4}
            </div>
            <div style={{ color: 'var(--tx2)', fontSize: 13, marginTop: 4 }}>
              Đã giải quyết gần đây
            </div>
          </Card>
        </Col>
      </Row>

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
            bodyStyle={{ padding: 0 }}
            style={{ borderRadius: 8, borderColor: 'var(--bd)', overflow: 'hidden' }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--sf2)', borderBottom: '1px solid var(--bd2)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Mã</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Tiêu đề</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Trạng thái</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--tx2)' }}>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {displayTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => {
                      if (!t.id.startsWith('mock-')) navigate(`/requester-dashboard/tickets/${t.id}`);
                    }}
                    style={{
                      borderBottom: '1px solid var(--bd)',
                      cursor: t.id.startsWith('mock-') ? 'default' : 'pointer',
                      transition: 'background 0.2s',
                    }}
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
                      {t.createdAt.includes('T') ? new Date(t.createdAt).toLocaleDateString('vi-VN') : t.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Col>

        {/* Right Column: Knowledge Base */}
        <Col xs={24} lg={9}>
          <div style={{ marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              Kho tri thức
            </Title>
          </div>

          <Card bordered style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--tx3)' }} />}
              placeholder="Tìm bài viết hướng dẫn…"
              style={{ borderRadius: 6, marginBottom: 16 }}
            />

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--bd)' }}>
                <a href="#vpn-win11" style={{ fontWeight: 600, color: 'var(--pr)', textDecoration: 'none' }}>
                  Cài đặt và kết nối VPN trên Windows 11
                </a>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
                  <BookOutlined style={{ marginRight: 4 }} /> Mạng &amp; VPN · 4 phút đọc
                </div>
              </div>

              <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--bd)' }}>
                <a href="#reset-vpn" style={{ fontWeight: 600, color: 'var(--pr)', textDecoration: 'none' }}>
                  Đặt lại mật khẩu và đồng bộ VPN
                </a>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
                  <BookOutlined style={{ marginRight: 4 }} /> Tài khoản · 3 phút đọc
                </div>
              </div>

              <div>
                <a href="#add-printer" style={{ fontWeight: 600, color: 'var(--pr)', textDecoration: 'none' }}>
                  Thêm máy in mạng cho tầng 4
                </a>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
                  <BookOutlined style={{ marginRight: 4 }} /> Thiết bị · 2 phút đọc
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
