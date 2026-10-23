import { Button, Card, Space, Tag, Typography } from 'antd';
import { RobotOutlined, CheckOutlined, BookOutlined } from '@ant-design/icons';
import type { TicketCategory } from '../model/ticket.types';

const { Title } = Typography;

interface CreateTicketAIPanelProps {
  onApplyCategory: (category: TicketCategory) => void;
}

export function CreateTicketAIPanel({ onApplyCategory }: CreateTicketAIPanelProps) {
  return (
    <Card
      bordered
      style={{
        borderRadius: 8,
        borderColor: 'var(--bd)',
        borderLeft: '4px solid var(--pr)',
        background: 'var(--sf)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <RobotOutlined style={{ color: 'var(--pr)', fontSize: 18 }} />
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
          Gợi ý AI
        </Title>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '10px 12px', fontSize: 13, marginBottom: 16 }}>
        <div style={{ color: 'var(--tx2)' }}>Danh mục</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Mạng &amp; VPN</span>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<CheckOutlined />}
            onClick={() => onApplyCategory('VPN')}
            style={{ borderRadius: 4, height: 24, fontSize: 12, padding: '0 8px' }}
          >
            Dùng
          </Button>
        </div>

        <div style={{ color: 'var(--tx2)' }}>Độ tin cậy</div>
        <div>
          <Tag color="success" style={{ borderRadius: 99, margin: 0 }}>
            Cao (92%)
          </Tag>
        </div>

        <div style={{ color: 'var(--tx2)' }}>Thông tin còn thiếu</div>
        <div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--tx2)', fontSize: 12 }}>
            <li>Phiên bản FortiClient đang cài đặt</li>
            <li>Nội dung mã lỗi hiển thị (ví dụ: -12, timeout)</li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 14, marginTop: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--tx)' }}>
          Bài viết liên quan
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size={6}>
          <div>
            <a href="#vpn-reset" style={{ color: 'var(--pr)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
              <BookOutlined style={{ marginRight: 6 }} /> Đặt lại mật khẩu và đồng bộ VPN
            </a>
          </div>
          <div>
            <a href="#vpn-fix" style={{ color: 'var(--pr)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
              <BookOutlined style={{ marginRight: 6 }} /> Khắc phục lỗi xác thực VPN
            </a>
          </div>
        </Space>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--tx3)', fontStyle: 'italic' }}>
        Chỉ là gợi ý. Bạn vẫn có thể gửi yêu cầu bất kỳ lúc nào.
      </div>
    </Card>
  );
}
