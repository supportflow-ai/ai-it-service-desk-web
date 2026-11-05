import { useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Modal, Radio, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useUsers } from '../hooks/useUsers';
import { useAssignRoles } from '../hooks/useAssignRoles';
import type { Role } from '../model/auth.types';
import { normalizeError } from '@/shared/api/httpError';

interface UserTableRow {
  key: string;
  userId: string;
  fullName: string | null;
  roles: Role[];
}

const ALL_ROLES: { label: string; value: Role }[] = [
  { label: 'Người dùng (Requester)', value: 'Requester' },
  { label: 'Kỹ thuật viên (Agent)', value: 'Agent' },
  { label: 'Quản trị viên (Admin)', value: 'Admin' },
];

export function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<'All' | 'Agent' | 'Admin'>('All');
  const [selectedUser, setSelectedUser] = useState<UserTableRow | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);

  const agentsQuery = useUsers('Agent');
  const adminsQuery = useUsers('Admin');
  const assignRolesMutation = useAssignRoles();

  const loading = agentsQuery.isPending || adminsQuery.isPending;
  const error = agentsQuery.error || adminsQuery.error;

  const users: UserTableRow[] = useMemo(() => {
    const agents = agentsQuery.data ?? [];
    const admins = adminsQuery.data ?? [];

    const map = new Map<string, UserTableRow>();

    agents.forEach((agent) => {
      map.set(agent.userId, {
        key: agent.userId,
        userId: agent.userId,
        fullName: agent.fullName,
        roles: ['Agent'],
      });
    });

    admins.forEach((admin) => {
      const existing = map.get(admin.userId);
      if (existing) {
        if (!existing.roles.includes('Admin')) {
          existing.roles.push('Admin');
        }
      } else {
        map.set(admin.userId, {
          key: admin.userId,
          userId: admin.userId,
          fullName: admin.fullName,
          roles: ['Admin'],
        });
      }
    });

    const all = Array.from(map.values());
    if (roleFilter === 'Agent') {
      return all.filter((u) => u.roles.includes('Agent'));
    }
    if (roleFilter === 'Admin') {
      return all.filter((u) => u.roles.includes('Admin'));
    }
    return all;
  }, [agentsQuery.data, adminsQuery.data, roleFilter]);

  const handleOpenModal = (record: UserTableRow) => {
    setSelectedUser(record);
    setSelectedRoles([...record.roles]);
    setModalError(null);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setSelectedRoles([]);
    setModalError(null);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    if (selectedRoles.length === 0) {
      setModalError('Người dùng phải có ít nhất một vai trò.');
      return;
    }
    setModalError(null);
    try {
      const res = await assignRolesMutation.mutateAsync({
        userId: selectedUser.userId,
        payload: { roles: selectedRoles },
      });
      message.success(res.message || 'Cập nhật vai trò thành công.');
      handleCloseModal();
    } catch (err: unknown) {
      setModalError(normalizeError(err).message);
    }
  };

  const columns: ColumnsType<UserTableRow> = [
    {
      title: 'Mã người dùng',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => <span className="mono">{userId}</span>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string | null) => name || <Typography.Text type="secondary">Chưa cập nhật</Typography.Text>,
    },
    {
      title: 'Vai trò hiện tại',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: Role[]) => (
        <Space size={4}>
          {roles.map((r) => (
            <Tag color={r === 'Admin' ? 'red' : r === 'Agent' ? 'blue' : 'default'} key={r}>
              {r}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: UserTableRow) => (
        <Button size="small" type="primary" onClick={() => handleOpenModal(record)}>
          Phân quyền
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px' }}>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        Quản trị phân quyền người dùng
      </Typography.Title>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải danh sách người dùng"
          description={normalizeError(error).message}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="Danh sách nhân sự hệ thống"
        extra={
          <Radio.Group
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="All">Tất cả</Radio.Button>
            <Radio.Button value="Agent">Kỹ thuật viên</Radio.Button>
            <Radio.Button value="Admin">Quản trị viên</Radio.Button>
          </Radio.Group>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không tìm thấy người dùng phù hợp' }}
        />
      </Card>

      <Modal
        title="Phân quyền người dùng"
        open={Boolean(selectedUser)}
        onCancel={handleCloseModal}
        onOk={handleSaveRoles}
        confirmLoading={assignRolesMutation.isPending}
        okText="Lưu vai trò"
        cancelText="Hủy"
        destroyOnHidden
      >
        {selectedUser && (
          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size="middle">
            {modalError && <Alert type="error" showIcon message={modalError} />}
            <div>
              <Typography.Text type="secondary">Họ và tên: </Typography.Text>
              <Typography.Text strong>{selectedUser.fullName || selectedUser.userId}</Typography.Text>
            </div>
            <div>
              <Typography.Text style={{ display: 'block', marginBottom: 8 }}>
                Chọn các vai trò áp dụng:
              </Typography.Text>
              <Checkbox.Group
                options={ALL_ROLES}
                value={selectedRoles}
                onChange={(values) => setSelectedRoles(values as Role[])}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
