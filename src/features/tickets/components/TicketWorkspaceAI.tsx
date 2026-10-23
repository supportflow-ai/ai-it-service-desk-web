import { useState } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import { BookOutlined, RobotOutlined } from '@ant-design/icons';

const { Title } = Typography;

export function TicketWorkspaceAI() {
  const [isStale, setIsStale] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RobotOutlined style={{ color: 'var(--pr)', fontSize: 18 }} />
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
          Hỗ trợ AI
        </Title>
      </div>

      <Card
        bordered
        style={{
          borderRadius: 8,
          borderColor: 'var(--bd)',
          borderLeft: '4px solid var(--pr)',
          background: 'var(--sf)',
        }}
        bodyStyle={{ padding: 14 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--tx)' }}>Gợi ý AI</span>
          <span className="meta">16:29</span>
        </div>

        <dl style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px 10px', fontSize: 13, margin: 0 }}>
          <dt style={{ color: 'var(--tx2)' }}>Danh mục</dt>
          <dd style={{ margin: 0, fontWeight: 500 }}>Mạng &amp; VPN</dd>

          <dt style={{ color: 'var(--tx2)' }}>Tác động</dt>
          <dd style={{ margin: 0 }}>Một người dùng</dd>

          <dt style={{ color: 'var(--tx2)' }}>Khẩn cấp</dt>
          <dd style={{ margin: 0 }}>Trung bình</dd>

          <dt style={{ color: 'var(--tx2)' }}>Tin cậy</dt>
          <dd style={{ margin: 0, fontWeight: 600, color: 'var(--ok)' }}>Cao (92%)</dd>
        </dl>

        <p style={{ fontSize: 13, color: 'var(--tx2)', margin: '12px 0 0', lineHeight: 1.4 }}>
          Triệu chứng khớp với lỗi đồng bộ mật khẩu sang hệ thống xác thực VPN.
        </p>

        {isStale && (
          <div className="stale-banner">
            Nội dung ticket đã thay đổi. Hãy phân tích lại trước khi sử dụng gợi ý này.
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          <Button
            type="primary"
            size="small"
            disabled={isStale}
            style={{ borderRadius: 4, fontWeight: 500 }}
          >
            Chấp nhận
          </Button>
          <Button
            size="small"
            disabled={isStale}
            style={{ borderRadius: 4 }}
          >
            Điều chỉnh
          </Button>
          <Button
            size="small"
            disabled={isStale}
            style={{ borderRadius: 4 }}
          >
            Từ chối
          </Button>
          <Button
            type="text"
            size="small"
            onClick={() => setIsStale(false)}
            style={{ color: 'var(--tx2)', borderRadius: 4 }}
          >
            Phân tích lại
          </Button>
        </div>
      </Card>

      {/* Knowledge Articles */}
      <Card
        bordered
        style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
        bodyStyle={{ padding: 14 }}
      >
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: 'var(--tx)' }}>
          Bài viết tri thức
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--bd)' }}>
            <a href="#vpn-kb" style={{ color: 'var(--pr)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
              <BookOutlined style={{ marginRight: 6 }} /> Đặt lại mật khẩu và đồng bộ VPN
            </a>
            <div className="meta" style={{ marginTop: 2 }}>Cập nhật 02/09/2026</div>
          </div>

          <div>
            <a href="#vpn-error-12" style={{ color: 'var(--pr)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}>
              <BookOutlined style={{ marginRight: 6 }} /> Khắc phục lỗi -12 trên FortiClient
            </a>
            <div className="meta" style={{ marginTop: 2 }}>Cập nhật 18/08/2026</div>
          </div>
        </Space>

        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--tx3)' }}>
          Ticket tương tự đã giải quyết chỉ hiện khi bạn có quyền xem.
        </div>

        <Button
          type="link"
          size="small"
          onClick={() => setIsStale((prev) => !prev)}
          style={{ padding: 0, marginTop: 8, fontSize: 12, color: 'var(--tx3)' }}
        >
          {isStale ? 'Tắt trạng thái "gợi ý cũ"' : 'Xem trạng thái "gợi ý cũ"'}
        </Button>
      </Card>
    </div>
  );
}
