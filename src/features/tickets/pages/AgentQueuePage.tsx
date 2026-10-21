import { useState } from 'react';
import { Button, Card, Checkbox, Input, Select, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { TicketStatusTag } from '../components/TicketStatusTag';
import { TicketStatus } from '../model/ticket.types';
import type { TicketPriority } from '../model/ticket.types';

const { Title, Text } = Typography;

interface QueueTicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  snippet: string;
  requesterName: string;
  department: string;
  category: string;
  priority: TicketPriority;
  priorityLabel: string;
  status: TicketStatus;
  assignee: string;
  slaText: string;
  slaType: 'warning' | 'danger' | 'info' | 'normal';
  updatedText: string;
}

const mockQueueItems: QueueTicketItem[] = [
  {
    id: 'f6a0adae-01bd-4892-0000-000000000001',
    ticketNumber: 'INC-2026-4892',
    title: 'Không thể kết nối VPN để truy cập tài nguyên nội bộ từ xa',
    snippet: 'FortiClient báo lỗi xác thực sau khi đổi mật khẩu…',
    requesterName: 'Nguyễn Văn An',
    department: 'Phòng Công nghệ',
    category: 'Mạng & VPN',
    priority: 'P2',
    priorityLabel: 'P2 — Cao',
    status: TicketStatus.InProgress,
    assignee: 'Trần Minh Quân',
    slaText: 'Còn 1 giờ 20',
    slaType: 'warning',
    updatedText: '10 phút',
  },
  {
    id: 'f6a0adae-01bd-4895-0000-000000000002',
    ticketNumber: 'INC-2026-4895',
    title: 'Không truy cập được Jira nội bộ',
    snippet: 'Trang báo 502 Bad Gateway từ 15:10…',
    requesterName: 'Lê Thu Hà',
    department: 'Phòng Kinh doanh',
    category: 'Ứng dụng',
    priority: 'P1',
    priorityLabel: 'P1 — Khẩn',
    status: TicketStatus.Submitted,
    assignee: '—',
    slaText: 'Quá hạn 12 phút',
    slaType: 'danger',
    updatedText: '25 phút',
  },
  {
    id: 'f6a0adae-01bd-4871-0000-000000000003',
    ticketNumber: 'INC-2026-4871',
    title: 'Không nhận được mã OTP Microsoft 365',
    snippet: 'Đã thử đổi số điện thoại nhưng chưa có mã…',
    requesterName: 'Phạm Quốc Bảo',
    department: 'Phòng Tài chính',
    category: 'Tài khoản',
    priority: 'P2',
    priorityLabel: 'P2 — Cao',
    status: TicketStatus.PendingUser,
    assignee: 'Trần Minh Quân',
    slaText: 'Tạm dừng',
    slaType: 'info',
    updatedText: '2 giờ',
  },
  {
    id: 'f6a0adae-01bd-4850-0000-000000000004',
    ticketNumber: 'INC-2026-4850',
    title: 'Yêu cầu cấp quyền GitLab cho dự án Payments',
    snippet: 'Cần quyền Maintainer, đã có phê duyệt của trưởng nhóm…',
    requesterName: 'Đỗ Khánh Linh',
    department: 'Phòng Công nghệ',
    category: 'Quyền truy cập',
    priority: 'P3',
    priorityLabel: 'P3 — Trung bình',
    status: TicketStatus.Assigned,
    assignee: 'Vũ Hải Nam',
    slaText: 'Còn 1 ngày',
    slaType: 'normal',
    updatedText: 'Hôm qua',
  },
  {
    id: 'f6a0adae-01bd-4887-0000-000000000005',
    ticketNumber: 'INC-2026-4887',
    title: 'Màn hình Dell chớp liên tục',
    snippet: 'Xuất hiện sau khi cập nhật driver card đồ họa…',
    requesterName: 'Hoàng Gia Huy',
    department: 'Phòng Thiết kế',
    category: 'Thiết bị',
    priority: 'P3',
    priorityLabel: 'P3 — Trung bình',
    status: TicketStatus.Triaged,
    assignee: '—',
    slaText: 'Còn 2 ngày',
    slaType: 'normal',
    updatedText: '3 giờ',
  },
  {
    id: 'f6a0adae-01bd-4879-0000-000000000006',
    ticketNumber: 'INC-2026-4879',
    title: 'Máy in tầng 4 báo offline',
    snippet: 'Đã khởi động lại nhưng vẫn không in được…',
    requesterName: 'Ngô Thị Mai',
    department: 'Hành chính',
    category: 'Thiết bị',
    priority: 'P3',
    priorityLabel: 'P3 — Trung bình',
    status: TicketStatus.InProgress,
    assignee: 'Vũ Hải Nam',
    slaText: 'Còn 6 giờ',
    slaType: 'normal',
    updatedText: '5 giờ',
  },
];

export function AgentQueuePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'unassigned'>('my');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // TanStack Query lấy dữ liệu từ API nếu có
  const ticketsQuery = useTickets(page, 10);
  const realTickets = ticketsQuery.data?.items ?? [];

  // Ghép real tickets nếu có, hoặc dùng mockQueueItems
  const queueItems: QueueTicketItem[] = realTickets.length > 0
    ? realTickets.map((t, idx) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.title,
        snippet: t.description.slice(0, 50) + (t.description.length > 50 ? '…' : ''),
        requesterName: t.requesterName ?? 'Nguyễn Văn An',
        department: t.departmentName ?? 'Phòng Công nghệ',
        category: t.categoryId,
        priority: t.priority ?? (idx % 3 === 0 ? 'P1' : idx % 3 === 1 ? 'P2' : 'P3'),
        priorityLabel: t.priority === 'P1' ? 'P1 — Khẩn' : t.priority === 'P2' ? 'P2 — Cao' : 'P3 — Trung bình',
        status: t.status,
        assignee: t.assignedToName ?? (t.status === TicketStatus.Assigned ? 'Trần Minh Quân' : '—'),
        slaText: t.slaText ?? 'Còn 1 giờ 20',
        slaType: t.priority === 'P1' ? 'danger' : 'warning',
        updatedText: '10 phút',
      }))
    : mockQueueItems;

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? queueItems.map((i) => i.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const renderSlaTag = (item: QueueTicketItem) => {
    let className = 'status-tag in';
    if (item.slaType === 'danger') className = 'status-tag er';
    else if (item.slaType === 'warning') className = 'status-tag wn';
    else if (item.slaType === 'info') className = 'meta';

    return <span className={className}>{item.slaText}</span>;
  };

  const renderPriority = (p: TicketPriority, label: string) => {
    let className = 'pri p3';
    if (p === 'P1') className = 'pri p1';
    else if (p === 'P2') className = 'pri p2';

    return <span className={className}>{label}</span>;
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          Hàng đợi xử lý
        </Title>
        <Text style={{ color: 'var(--tx3)', fontSize: 13 }}>
          Cập nhật 16:38
        </Text>
      </div>

      {/* Queue Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bd)', marginBottom: 16 }}>
        <Button
          type="text"
          onClick={() => setActiveTab('my')}
          style={{
            borderRadius: 0,
            borderBottom: activeTab === 'my' ? '2px solid var(--pr)' : '2px solid transparent',
            color: activeTab === 'my' ? 'var(--pr)' : 'var(--tx2)',
            fontWeight: 600,
            padding: '8px 16px',
            height: 'auto',
          }}
        >
          Của tôi ({queueItems.length > 0 ? 7 : 0})
        </Button>

        <Button
          type="text"
          onClick={() => setActiveTab('team')}
          style={{
            borderRadius: 0,
            borderBottom: activeTab === 'team' ? '2px solid var(--pr)' : '2px solid transparent',
            color: activeTab === 'team' ? 'var(--pr)' : 'var(--tx2)',
            fontWeight: 600,
            padding: '8px 16px',
            height: 'auto',
          }}
        >
          Hàng đợi nhóm (23)
        </Button>

        <Button
          type="text"
          onClick={() => setActiveTab('unassigned')}
          style={{
            borderRadius: 0,
            borderBottom: activeTab === 'unassigned' ? '2px solid var(--pr)' : '2px solid transparent',
            color: activeTab === 'unassigned' ? 'var(--pr)' : 'var(--tx2)',
            fontWeight: 600,
            padding: '8px 16px',
            height: 'auto',
          }}
        >
          Chưa phân công (5)
        </Button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--tx3)' }} />}
          placeholder="Tìm theo mã hoặc tiêu đề"
          style={{ maxWidth: 260, borderRadius: 6 }}
        />
        <Select defaultValue="all-status" style={{ width: 160 }} options={[{ value: 'all-status', label: 'Trạng thái: Tất cả' }]} />
        <Select defaultValue="all-pri" style={{ width: 150 }} options={[{ value: 'all-pri', label: 'Ưu tiên: Tất cả' }]} />
        <Select defaultValue="all-cat" style={{ width: 160 }} options={[{ value: 'all-cat', label: 'Danh mục: Tất cả' }]} />
        <Select defaultValue="infra" style={{ width: 160 }} options={[{ value: 'infra', label: 'Nhóm: Hạ tầng' }]} />
      </div>

      {/* Queue Table */}
      <Card
        bordered
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 8, borderColor: 'var(--bd)', overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--sf2)', borderBottom: '1px solid var(--bd2)' }}>
                <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}>
                  <Checkbox
                    checked={selectedIds.length === queueItems.length && queueItems.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < queueItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Mã</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Tiêu đề</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Người yêu cầu</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Danh mục</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Ưu tiên</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Trạng thái</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>Phụ trách</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--tx2)' }}>SLA</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--tx2)' }}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {queueItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--bd)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    background: selectedIds.includes(item.id) ? 'var(--sel)' : undefined,
                  }}
                  onClick={() => navigate(`/agent-workspace/tickets/${item.id}`)}
                >
                  <td
                    style={{ padding: '10px 12px', textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                    />
                  </td>
                  <td style={{ padding: '10px 12px' }} className="mono">
                    {item.ticketNumber}
                  </td>
                  <td style={{ padding: '10px 12px', maxWidth: 300 }}>
                    <div style={{ fontWeight: 600, color: 'var(--tx)' }}>{item.title}</div>
                    <div style={{ color: 'var(--tx3)', fontSize: 12, marginTop: 2 }}>{item.snippet}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--tx)' }}>{item.requesterName}</div>
                    <div style={{ color: 'var(--tx3)', fontSize: 12 }}>{item.department}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--tx)' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {renderPriority(item.priority, item.priorityLabel)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <TicketStatusTag status={item.status} />
                  </td>
                  <td style={{ padding: '10px 12px', color: item.assignee === '—' ? 'var(--tx3)' : 'var(--tx)' }}>
                    {item.assignee}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {renderSlaTag(item)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--tx3)' }}>
                    {item.updatedText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--bd)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            color: 'var(--tx3)',
          }}
        >
          <span>1–6 trên 35 ticket</span>
          <Space size={4}>
            <Button size="small" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Trước
            </Button>
            <Button size="small" type="primary">1</Button>
            <Button size="small" type="text">2</Button>
            <Button size="small" type="text">3</Button>
            <Button size="small" onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </Space>
        </div>
      </Card>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--tx3)' }}>
        Chọn một hoặc nhiều ticket để hiện thanh thao tác hàng loạt.
      </div>
    </div>
  );
}
