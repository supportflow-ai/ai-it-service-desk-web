import { Alert, Button, Card, Col, DatePicker, Empty, Row, Select, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { hasAnyRole, useAuth } from '@/features/auth';

const UNSUPPORTED_REASON = 'Backend chưa có API báo cáo SLA';

export function SlaReportsPage() {
  const { user } = useAuth();
  const isAdmin = hasAnyRole(user?.roles ?? [], ['Admin']);

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <Typography.Title level={3}>Không có quyền truy cập</Typography.Title>
        <Typography.Paragraph type="secondary">
          Bạn cần quyền Quản trị viên (Admin) để xem báo cáo SLA.
        </Typography.Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            Báo cáo SLA
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Thống kê tuân thủ SLA theo thời gian, đội nhóm hỗ trợ và mức ưu tiên.
          </Typography.Paragraph>
        </div>
        <Button icon={<DownloadOutlined />} size="large" disabled title={`Xuất báo cáo: chưa hỗ trợ. ${UNSUPPORTED_REASON}.`}>
          Xuất báo cáo
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Báo cáo SLA chưa được hỗ trợ"
        description="Backend hiện chưa có API báo cáo SLA nên màn hình không hiển thị số liệu và các thao tác lọc, xuất báo cáo đang bị khóa. Khi hợp đồng API được xác nhận, màn hình sẽ được kích hoạt."
      />

      <Card size="small" style={{ marginBottom: 16, borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={10}>
            <DatePicker.RangePicker disabled style={{ width: '100%' }} aria-label="Khoảng thời gian (chưa hỗ trợ)" />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <Select disabled style={{ width: '100%' }} placeholder="Đội nhóm hỗ trợ (chưa hỗ trợ)" aria-label="Đội nhóm hỗ trợ (chưa hỗ trợ)" />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <Select disabled style={{ width: '100%' }} placeholder="Mức ưu tiên (chưa hỗ trợ)" aria-label="Mức ưu tiên (chưa hỗ trợ)" />
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
        <Empty description="Chưa có dữ liệu báo cáo SLA: chức năng chưa được hỗ trợ" />
      </Card>
    </div>
  );
}
