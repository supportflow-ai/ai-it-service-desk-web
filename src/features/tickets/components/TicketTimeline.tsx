import { Card, Space } from 'antd';
import { UnsupportedState } from '@/shared/ui/UnsupportedState';

export function TicketTimeline() {
  return (
    <Card
      title="Hoạt động &amp; Trao đổi"
      bordered
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      <div style={{ marginBottom: 16 }}>
        <UnsupportedState feature="Lịch sử xử lý" />
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
        Tiến trình xử lý
      </div>

      <ul className="activity-tl">
        <li>
          <span style={{ fontWeight: 600 }}>Nguyễn Văn An</span> tạo ticket
          <div className="meta">14:05</div>
        </li>
        <li>
          Hệ thống phân loại vào <span style={{ fontWeight: 600 }}>Mạng &amp; VPN</span> · nhóm Hạ tầng
          <div className="meta">14:06</div>
        </li>
        <li>
          <span style={{ fontWeight: 600 }}>Trần Minh Quân</span> chuyển sang Đang xử lý
          <div className="meta">15:40</div>
        </li>
      </ul>

      <div style={{ fontWeight: 600, fontSize: 13, margin: '20px 0 12px' }}>
        Trao đổi gần đây
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <div className="msg-card">
          <header>
            <span style={{ fontWeight: 600 }}>Trần Minh Quân · Phản hồi công khai</span>
            <span className="meta">15:42</span>
          </header>
          <div style={{ fontSize: 13, color: 'var(--tx)', marginTop: 4 }}>
            Chào anh An, anh vui lòng gửi giúp phiên bản FortiClient đang dùng nhé.
          </div>
        </div>

        <div className="msg-card">
          <header>
            <span style={{ fontWeight: 600 }}>Nguyễn Văn An · Người yêu cầu</span>
            <span className="meta">16:28</span>
          </header>
          <div style={{ fontSize: 13, color: 'var(--tx)', marginTop: 4 }}>
            Phiên bản 7.2.4, mã lỗi -12 khi nhập mật khẩu mới.
          </div>
        </div>

        <div className="msg-card note">
          <header>
            <span style={{ fontWeight: 600, color: '#85590E' }}>Ghi chú nội bộ · Trần Minh Quân</span>
            <span className="meta">16:31</span>
          </header>
          <div style={{ fontSize: 13, color: '#5C3E08', marginTop: 4 }}>
            Nghi ngờ tài khoản chưa đồng bộ sang FortiAuthenticator. Cần kiểm tra thủ công.
          </div>
        </div>
      </Space>
    </Card>
  );
}
