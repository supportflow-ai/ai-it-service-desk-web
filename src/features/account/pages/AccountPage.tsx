import { useState } from 'react';
import { Alert, Button, Card, Descriptions, Select, Space, Switch, Tag, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { ChangePasswordModal, useAuth } from '@/features/auth';
import type { Role } from '@/features/auth';

const { Title, Text } = Typography;

const roleLabels: Record<Role, string> = { Admin: 'Quản trị viên', Agent: 'Kỹ thuật viên', Requester: 'Người yêu cầu' };

export function AccountPage() {
  const { user } = useAuth();
  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  if (!user) return null;

  return (
    <div style={{ maxWidth: 760 }}>
      <Title level={3} style={{ marginTop: 0 }}>Hồ sơ cá nhân và cài đặt tài khoản</Title>

      <Card title="Thông tin cá nhân" style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" styles={{ label: { width: 140 } }}>
          <Descriptions.Item label="Họ và tên">{user.fullName ?? 'Chưa cập nhật'}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Space size={4} wrap>
              {user.roles.length === 0 ? <Text type="secondary">Chưa có vai trò</Text> : user.roles.map((role) => <Tag key={role}>{roleLabels[role]}</Tag>)}
            </Space>
          </Descriptions.Item>
        </Descriptions>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Chỉnh sửa thông tin cá nhân chưa được hỗ trợ: backend chưa có endpoint cập nhật hồ sơ.
        </Text>
      </Card>

      <Card title="Bảo mật" style={{ marginBottom: 16 }}>
        <Button icon={<KeyOutlined />} onClick={() => setOpenPasswordModal(true)}>
          Đổi mật khẩu
        </Button>
      </Card>

      <Card title="Tuỳ chọn">
        <Alert
          type="info"
          showIcon
          message="Tuỳ chọn ngôn ngữ và thông báo chưa được hỗ trợ"
          description="Backend chưa có endpoint lưu tuỳ chọn người dùng nên các mục dưới đây bị khoá."
          style={{ marginBottom: 16 }}
        />
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <Text>Ngôn ngữ</Text>
            <Select
              disabled
              aria-label="Ngôn ngữ (chưa hỗ trợ)"
              value="vi"
              options={[{ value: 'vi', label: 'Tiếng Việt' }]}
              style={{ width: 160 }}
            />
          </Space>
          <Space>
            <Text>Thông báo qua email</Text>
            <Switch disabled aria-label="Thông báo qua email (chưa hỗ trợ)" />
          </Space>
        </Space>
      </Card>

      <ChangePasswordModal open={openPasswordModal} onClose={() => setOpenPasswordModal(false)} />
    </div>
  );
}
