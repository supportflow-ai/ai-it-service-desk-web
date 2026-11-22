import { useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Drawer,
  Form,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CrownOutlined, UserAddOutlined, UserDeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth, useUsers } from '@/features/auth';
import type { SupportTeamDto, SupportTeamMemberDto } from '../model/supportTeam.types';
import { canManageTeamMembers } from '../model/supportTeamPermissions';
import { useSupportTeamMembers } from '../hooks/useSupportTeamMembers';
import { useAddTeamMember, useRemoveTeamMember } from '../hooks/useTeamMemberMutations';
import { normalizeError } from '@/shared/api/httpError';

interface SupportTeamMembersDrawerProps {
  open: boolean;
  team: SupportTeamDto | null;
  onClose: () => void;
}

interface AddMemberFormValues {
  userId: string;
  role: 'Lead' | 'Agent';
}

export function SupportTeamMembersDrawer({ open, team, onClose }: SupportTeamMembersDrawerProps) {
  const { user } = useAuth();
  const [form] = Form.useForm<AddMemberFormValues>();
  const [actionError, setActionError] = useState<string | null>(null);

  const teamId = team?.id ?? '';
  const membersQuery = useSupportTeamMembers(teamId);
  const agentsQuery = useUsers('Agent');

  const addMemberMutation = useAddTeamMember(teamId);
  const removeMemberMutation = useRemoveTeamMember(teamId);

  const isAllowedToManage = team ? canManageTeamMembers(user, team) : false;
  const isPending = addMemberMutation.isPending || removeMemberMutation.isPending;

  const currentMembers = membersQuery.data ?? team?.members ?? [];
  const existingUserIds = new Set(currentMembers.map((m) => m.userId));

  const availableAgents = (agentsQuery.data ?? [])
    .filter((agent) => !existingUserIds.has(agent.userId))
    .map((agent) => ({
      value: agent.userId,
      label: agent.fullName ?? `Kỹ thuật viên (${agent.userId.slice(0, 8)})`,
    }));

  const handleAddMember = async (values: AddMemberFormValues) => {
    setActionError(null);
    try {
      await addMemberMutation.mutateAsync(values);
      form.resetFields();
    } catch (err) {
      setActionError(normalizeError(err).message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setActionError(null);
    try {
      await removeMemberMutation.mutateAsync(userId);
    } catch (err) {
      setActionError(normalizeError(err).message);
    }
  };

  const columns: ColumnsType<SupportTeamMemberDto> = [
    {
      title: 'Kỹ thuật viên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (fullName: string | null, record) => (
        <Space>
          <Avatar
            icon={record.role === 'Lead' ? <CrownOutlined /> : <UserOutlined />}
            style={{ backgroundColor: record.role === 'Lead' ? '#faad14' : '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{fullName ?? 'Chưa đặt tên'}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.userId.slice(0, 8)}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò trong đội',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: 'Lead' | 'Agent') => (
        role === 'Lead' ? (
          <Tag color="gold" icon={<CrownOutlined />}>Trưởng nhóm</Tag>
        ) : (
          <Tag color="blue">Kỹ thuật viên</Tag>
        )
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 130,
      render: (val: string) => (val ? new Date(val).toLocaleDateString('vi-VN') : '—'),
    },
  ];

  if (isAllowedToManage) {
    columns.push({
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Popconfirm
          title="Xóa thành viên khỏi đội?"
          description={`Bạn có chắc muốn xóa kỹ thuật viên này khỏi ${team?.name}?`}
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => handleRemoveMember(record.userId)}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<UserDeleteOutlined />}
            disabled={isPending}
          />
        </Popconfirm>
      ),
    });
  }

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined />
          <span>Thành viên: {team?.name}</span>
        </Space>
      }
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {actionError && (
        <Alert
          type="error"
          showIcon
          message={actionError}
          style={{ marginBottom: 16 }}
        />
      )}

      {isAllowedToManage && (
        <div style={{ background: 'var(--sf-subtle, #f5f5f5)', padding: 14, borderRadius: 8, marginBottom: 20 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 10 }}>
            Thêm kỹ thuật viên vào đội
          </Typography.Text>
          <Form<AddMemberFormValues>
            form={form}
            layout="inline"
            onFinish={handleAddMember}
            initialValues={{ role: 'Agent' }}
            disabled={isPending}
            style={{ rowGap: 8 }}
          >
            <Form.Item
              name="userId"
              rules={[{ required: true, message: 'Chọn kỹ thuật viên' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select
                placeholder="Chọn kỹ thuật viên"
                showSearch
                optionFilterProp="label"
                options={availableAgents}
                loading={agentsQuery.isPending}
                notFoundContent="Không có kỹ thuật viên khả dụng"
              />
            </Form.Item>

            <Form.Item name="role" style={{ width: 130 }}>
              <Select
                options={[
                  { value: 'Agent', label: 'Thành viên' },
                  { value: 'Lead', label: 'Trưởng nhóm' },
                ]}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<UserAddOutlined />}
                loading={addMemberMutation.isPending}
              >
                Thêm
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}

      <Table<SupportTeamMemberDto>
        dataSource={currentMembers}
        columns={columns}
        rowKey="userId"
        loading={membersQuery.isPending}
        pagination={false}
        locale={{ emptyText: 'Chưa có thành viên nào trong đội này.' }}
        size="small"
      />
    </Drawer>
  );
}
