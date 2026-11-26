import { Button, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CrownOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import { ticketCategoryLabels } from '@/features/tickets';
import type { SupportTeamDto } from '../model/supportTeam.types';
import { canManageAllTeams } from '../model/supportTeamPermissions';

interface SupportTeamTableProps {
  teams: SupportTeamDto[];
  loading?: boolean;
  onEditTeam: (team: SupportTeamDto) => void;
  onViewMembers: (team: SupportTeamDto) => void;
}

export function SupportTeamTable({ teams, loading, onEditTeam, onViewMembers }: SupportTeamTableProps) {
  const { user } = useAuth();
  const isAdmin = canManageAllTeams(user);

  const columns: ColumnsType<SupportTeamDto> = [
    {
      title: 'Đội nhóm hỗ trợ',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <Space align="center">
            <span style={{ fontWeight: 600 }}>{name}</span>
            <Tag color="geekblue" style={{ fontWeight: 500 }}>{record.code}</Tag>
            {record.isDefaultTriage && (
              <Tag color="gold">Hàng đợi Triage</Tag>
            )}
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
      title: 'Trưởng nhóm (Lead)',
      dataIndex: 'leadName',
      key: 'leadName',
      width: 180,
      render: (leadName: string | null) => (
        leadName ? (
          <Space>
            <CrownOutlined style={{ color: '#faad14' }} />
            <span>{leadName}</span>
          </Space>
        ) : (
          <Typography.Text type="secondary" italic>Chưa chỉ định</Typography.Text>
        )
      ),
    },
    {
      title: 'Danh mục tiếp nhận',
      dataIndex: 'categories',
      key: 'categories',
      width: 250,
      render: (categories: SupportTeamDto['categories']) => (
        <Space wrap size={[4, 4]}>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <Tag key={cat} color="cyan" style={{ fontSize: 12 }}>
                {ticketCategoryLabels[cat] ?? cat}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary" italic style={{ fontSize: 12 }}>
              Không ràng buộc
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Thành viên',
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 110,
      align: 'center',
      render: (count: number, record) => (
        <Button
          type="link"
          size="small"
          icon={<TeamOutlined />}
          aria-label={`Xem thành viên ${record.name}`}
          onClick={() => onViewMembers(record)}
        >
          {count} người
        </Button>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: 'active' | 'inactive') => (
        status === 'active' ? (
          <Tag color="success">Hoạt động</Tag>
        ) : (
          <Tag color="default">Tạm dừng</Tag>
        )
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem thành viên">
            <Button
              type="text"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => onViewMembers(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Chỉnh sửa đội">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEditTeam(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<SupportTeamDto>
      dataSource={teams}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      locale={{ emptyText: 'Chưa có đội nhóm hỗ trợ nào.' }}
    />
  );
}
