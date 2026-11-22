import { useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Select, Statistic, Typography, message } from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { normalizeError } from '@/shared/api/httpError';
import type { ServiceCategoryItemDto } from '../model/serviceCatalog.types';
import { canManageServiceCatalog } from '../model/serviceCatalogPermissions';
import { useServiceCategories } from '../hooks/useServiceCategories';
import { useDeleteServiceCategory } from '../hooks/useServiceCategoryMutations';
import { ServiceCategoryTable } from '../components/ServiceCategoryTable';
import { ServiceCategoryFormModal } from '../components/ServiceCategoryFormModal';

export function ServiceCatalogManagementPage() {
  const { user } = useAuth();
  const isAdmin = canManageServiceCatalog(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryItemDto | null>(null);

  const categoriesQuery = useServiceCategories();
  const deleteMutation = useDeleteServiceCategory();

  const allCategories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const filteredCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        cat.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [allCategories, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = allCategories.length;
    const active = allCategories.filter((c) => c.status === 'active').length;
    const assignedTeams = allCategories.filter((c) => Boolean(c.targetTeamId)).length;
    return { total, active, assignedTeams };
  }, [allCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category: ServiceCategoryItemDto) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingCategory(null);
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Đã xóa danh mục dịch vụ thành công');
    } catch (err) {
      message.error(normalizeError(err).message);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <Typography.Title level={3}>Không có quyền truy cập</Typography.Title>
        <Typography.Paragraph type="secondary">
          Bạn cần quyền Quản trị viên (Admin) để quản lý danh mục dịch vụ.
        </Typography.Paragraph>
      </div>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <ErrorState
        error={categoriesQuery.error}
        onRetry={() => void categoriesQuery.refetch()}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            Quản lý Danh mục Dịch vụ
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Quản lý cây danh mục dịch vụ IT, định tuyến đội hỗ trợ tiếp nhận mặc định và thiết lập cam kết SLA.
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreate}
          style={{ borderRadius: 6 }}
        >
          Thêm danh mục dịch vụ
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Tổng số danh mục"
              value={stats.total}
              prefix={<AppstoreOutlined style={{ color: '#1890ff', marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Đang cung cấp"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
            <Statistic
              title="Đã gán đội xử lý"
              value={stats.assignedTeams}
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
              placeholder="Tìm kiếm theo tên danh mục, mã hoặc mô tả..."
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
                { value: 'active', label: 'Đang cung cấp' },
                { value: 'inactive', label: 'Tạm ngừng' },
              ]}
            />
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Hiển thị <strong>{filteredCategories.length}</strong> / {allCategories.length} danh mục
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
        styles={{ body: { padding: 0 } }}
      >
        <ServiceCategoryTable
          categories={filteredCategories}
          loading={categoriesQuery.isPending}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* Form Modal */}
      <ServiceCategoryFormModal
        open={isFormOpen}
        category={editingCategory}
        onClose={handleCloseForm}
      />
    </div>
  );
}
