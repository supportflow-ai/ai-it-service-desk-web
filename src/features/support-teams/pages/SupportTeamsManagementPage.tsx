import { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Select, Statistic, Typography } from 'antd';
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import type { SupportTeamDto } from '../model/supportTeam.types';
import { canManageAllTeams } from '../model/supportTeamPermissions';
import { useSupportTeams } from '../hooks/useSupportTeams';
import { SupportTeamTable } from '../components/SupportTeamTable';
import { SupportTeamFormModal } from '../components/SupportTeamFormModal';
import { SupportTeamMembersDrawer } from '../components/SupportTeamMembersDrawer';

export function SupportTeamsManagementPage() {
  const { user } = useAuth();
  const isAdmin = canManageAllTeams(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<SupportTeamDto | null>(null);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<SupportTeamDto | null>(null);

  const teamsQuery = useSupportTeams();

  const allTeams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);

  const filteredTeams = useMemo(() => {
    return allTeams.filter((team) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || team.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [allTeams, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = allTeams.length;
    const active = allTeams.filter((t) => t.status === 'active').length;
    const totalMembers = allTeams.reduce((acc, t) => acc + t.memberCount, 0);
    const triage = allTeams.find((t) => t.isDefaultTriage);
    return { total, active, totalMembers, triageName: triage?.name ?? 'Chưa cấu hình' };
  }, [allTeams]);

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (team: SupportTeamDto) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTeam(null);
    setIsFormOpen(false);
  };

  const handleOpenMembers = (team: SupportTeamDto) => {
    setSelectedTeamForMembers(team);
  };

  const handleCloseMembers = () => {
    setSelectedTeamForMembers(null);
  };

  if (teamsQuery.isError) {
    return (
      <ErrorState
        error={teamsQuery.error}
        onRetry={() => void teamsQuery.refetch()}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            Quản lý Đội nhóm Hỗ trợ
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Tổ chức các nhóm chuyên trách, chỉ định Trưởng nhóm (Lead), quản lý thành viên kỹ thuật viên và cấu hình danh mục tiếp nhận tự động.
          </Typography.Paragraph>
        </div>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleOpenCreate}
            style={{ borderRadius: 6 }}
          >
            Thêm đội mới
          </Button>
        )}
      </div>

      {/* Summary Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Tổng số đội nhóm"
              value={stats.total}
              prefix={<ApartmentOutlined style={{ color: '#1890ff', marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Đội đang hoạt động"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Tổng kỹ thuật viên"
              value={stats.totalMembers}
              prefix={<TeamOutlined style={{ color: '#722ed1', marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <div style={{ color: 'var(--tx-subtle, #888)', fontSize: 13, marginBottom: 4 }}>
              Hàng đợi Triage mặc định
            </div>
            <Typography.Text strong ellipsis style={{ fontSize: 16, display: 'block' }}>
              {stats.triageName}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card
        size="small"
        style={{ marginBottom: 16, borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={14} md={10}>
            <Input
              placeholder="Tìm kiếm theo tên đội, mã đội hoặc mô tả..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={10} md={6}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Tạm ngừng' },
              ]}
            />
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Hiển thị <strong>{filteredTeams.length}</strong> / {allTeams.length} đội nhóm
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* Teams Table */}
      <Card
        style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
        styles={{ body: { padding: 0 } }}
      >
        <SupportTeamTable
          teams={filteredTeams}
          loading={teamsQuery.isPending}
          onEditTeam={handleOpenEdit}
          onViewMembers={handleOpenMembers}
        />
      </Card>

      {/* Create / Edit Modal */}
      <SupportTeamFormModal
        open={isFormOpen}
        team={editingTeam}
        onClose={handleCloseForm}
      />

      {/* Team Members Drawer */}
      <SupportTeamMembersDrawer
        open={Boolean(selectedTeamForMembers)}
        team={selectedTeamForMembers}
        onClose={handleCloseMembers}
      />
    </div>
  );
}
