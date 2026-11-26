import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApartmentOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ServiceCategoryItemDto } from '../model/serviceCatalog.types';

interface ServiceCategoryTableProps {
  categories: ServiceCategoryItemDto[];
  loading?: boolean;
  onEdit: (category: ServiceCategoryItemDto) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'error',
  P2: 'warning',
  P3: 'processing',
  P4: 'default',
};

export function ServiceCategoryTable({ categories, loading, onEdit, onDelete }: ServiceCategoryTableProps) {
  const columns: ColumnsType<ServiceCategoryItemDto> = [
    {
      title: 'Danh mục dịch vụ',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <Space align="center">
            <span style={{ fontWeight: 600 }}>{name}</span>
            <Tag color="geekblue" style={{ fontWeight: 500 }}>{record.code}</Tag>
          </Space>
          <Typography.Paragraph
            type="secondary"
            ellipsis={{ rows: 2 }}
            style={{ fontSize: 13, marginBottom: 0, marginTop: 4, maxWidth: 360 }}
          >
            {record.description}
          </Typography.Paragraph>
        </div>
      ),
    },
    {
      title: 'Đội tiếp nhận mặc định',
      dataIndex: 'targetTeamName',
      key: 'targetTeamName',
      width: 200,
      render: (targetTeamName: string | null) => (
        targetTeamName ? (
          <Tag color="blue" icon={<ApartmentOutlined />}>
            {targetTeamName}
          </Tag>
        ) : (
          <Typography.Text type="secondary" italic>Hàng đợi chung (Triage)</Typography.Text>
        )
      ),
    },
    {
      title: 'Mức ưu tiên & SLA',
      key: 'prioritySla',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={PRIORITY_COLORS[record.defaultPriority] ?? 'default'}>
            Ưu tiên: {record.defaultPriority}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            SLA: {record.targetResolutionHours} giờ
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Số phiếu',
      dataIndex: 'ticketCount',
      key: 'ticketCount',
      width: 100,
      align: 'center',
      render: (count?: number) => (
        <Tag color="cyan">{count ?? 0} phiếu</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: 'active' | 'inactive') => (
        status === 'active' ? (
          <Tag color="success">Đang cung cấp</Tag>
        ) : (
          <Tag color="default">Tạm ngừng</Tag>
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
          <Tooltip title="Xóa danh mục">
            <Popconfirm
              title="Xóa danh mục dịch vụ này?"
              description={`Bạn có chắc muốn xóa danh mục ${record.name}?`}
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
    <Table<ServiceCategoryItemDto>
      dataSource={categories}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      locale={{ emptyText: 'Chưa có danh mục dịch vụ nào.' }}
    />
  );
}
