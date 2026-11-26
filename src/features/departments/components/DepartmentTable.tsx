import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import type { DepartmentItemDto } from '../model/department.types';

interface DepartmentTableProps {
  departments: DepartmentItemDto[];
  loading?: boolean;
  onEdit: (department: DepartmentItemDto) => void;
  onDelete: (id: string) => void;
}

export function DepartmentTable({ departments, loading, onEdit, onDelete }: DepartmentTableProps) {
  const columns: ColumnsType<DepartmentItemDto> = [
    {
      title: 'Phòng ban',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <Space align="center">
            <span style={{ fontWeight: 600 }}>{name}</span>
            <Tag color="blue" style={{ fontWeight: 500 }}>{record.code}</Tag>
          </Space>
          {record.description && (
            <Typography.Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ fontSize: 13, marginBottom: 0, marginTop: 4, maxWidth: 360 }}
            >
              {record.description}
            </Typography.Paragraph>
          )}
        </div>
      ),
    },
    {
      title: 'Người phụ trách',
      dataIndex: 'managerName',
      key: 'managerName',
      width: 200,
      render: (managerName: string | null) => (
        managerName ? (
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span>{managerName}</span>
          </Space>
        ) : (
          <Typography.Text type="secondary" italic>Chưa phân công</Typography.Text>
        )
      ),
    },
    {
      title: 'Nhân sự',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 120,
      align: 'center',
      render: (count?: number) => (
        <Tag color="cyan">{count ?? 0} người</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status?: 'active' | 'inactive') => (
        status === 'inactive' ? (
          <Tag color="default">Tạm dừng</Tag>
        ) : (
          <Tag color="success">Đang hoạt động</Tag>
        )
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa phòng ban">
            <Popconfirm
              title="Xóa phòng ban này?"
              description={`Bạn có chắc muốn xóa phòng ban ${record.name}?`}
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => onDelete(record.id)}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<DepartmentItemDto>
      dataSource={departments}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      locale={{ emptyText: 'Chưa có phòng ban nào.' }}
    />
  );
}
