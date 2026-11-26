import { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Select, Statistic, Typography, message } from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { normalizeError } from '@/shared/api/httpError';
import type { DepartmentItemDto } from '../model/department.types';
import { canManageDepartments } from '../model/departmentPermissions';
import { useDepartmentsList } from '../hooks/useDepartmentsList';
import { useDeleteDepartment } from '../hooks/useDepartmentMutations';
import { DepartmentTable } from '../components/DepartmentTable';
import { DepartmentFormModal } from '../components/DepartmentFormModal';

export function DepartmentsManagementPage() {
  const { user } = useAuth();
  const isAdmin = canManageDepartments(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentItemDto | null>(null);

  const departmentsQuery = useDepartmentsList();
  const deleteMutation = useDeleteDepartment();

  const allDepartments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);

  const filteredDepartments = useMemo(() => {
    return allDepartments.filter((dep) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dep.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dep.description && dep.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && dep.status !== 'inactive') ||
        (statusFilter === 'inactive' && dep.status === 'inactive');

      return matchSearch && matchStatus;
    });
  }, [allDepartments, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = allDepartments.length;
    const active = allDepartments.filter((d) => d.status !== 'inactive').length;
    const totalEmployees = allDepartments.reduce((acc, d) => acc + (d.employeeCount ?? 0), 0);
    return { total, active, totalEmployees };
  }, [allDepartments]);

  const handleOpenCreate = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (department: DepartmentItemDto) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingDepartment(null);
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Đã xóa phòng ban thành công');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <Typography.Title level={3}>Không có quyền truy cập</Typography.Title>
        <Typography.Paragraph type="secondary">
          Bạn cần quyền Quản trị viên (Admin) để quản lý danh mục phòng ban.
        </Typography.Paragraph>
      </div>
    );
  }

  if (departmentsQuery.isError) {
    return (
      <ErrorState
        error={departmentsQuery.error}
        onRetry={() => void departmentsQuery.refetch()}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            Quản lý Phòng ban
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Quản lý các phòng ban trong tổ chức, người phụ trách và đơn vị yêu cầu hỗ trợ (Requester Departments).
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreate}
          style={{ borderRadius: 6 }}
        >
          Thêm phòng ban mới
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Tổng số phòng ban"
              value={stats.total}
              prefix={<BankOutlined style={{ color: '#1890ff', marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Tổng nhân sự trực thuộc"
              value={stats.totalEmployees}
              prefix={<TeamOutlined style={{ color: '#722ed1', marginRight: 4 }} />}
            />
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
              placeholder="Tìm kiếm theo tên phòng ban, mã hoặc mô tả..."
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
                { value: 'inactive', label: 'Tạm dừng' },
              ]}
            />
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Hiển thị <strong>{filteredDepartments.length}</strong> / {allDepartments.length} phòng ban
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* Departments Table */}
      <Card
        style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
        styles={{ body: { padding: 0 } }}
      >
        <DepartmentTable
          departments={filteredDepartments}
          loading={departmentsQuery.isPending}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* Form Modal */}
      <DepartmentFormModal
        open={isFormOpen}
        department={editingDepartment}
        onClose={handleCloseForm}
      />
    </div>
  );
}
