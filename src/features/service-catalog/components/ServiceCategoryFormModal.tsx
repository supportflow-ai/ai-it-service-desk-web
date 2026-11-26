import { useEffect } from 'react';
import { Alert, Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import { useSupportTeams } from '@/features/support-teams';
import type {
  CreateServiceCategoryPayload,
  ServiceCategoryItemDto,
  UpdateServiceCategoryPayload,
} from '../model/serviceCatalog.types';
import { useCreateServiceCategory, useUpdateServiceCategory } from '../hooks/useServiceCategoryMutations';
import { normalizeError } from '@/shared/api/httpError';

interface ServiceCategoryFormModalProps {
  open: boolean;
  category?: ServiceCategoryItemDto | null;
  onClose: () => void;
}

interface FormValues {
  code: string;
  name: string;
  description: string;
  targetTeamId?: string;
  defaultPriority: 'P1' | 'P2' | 'P3' | 'P4';
  targetResolutionHours: number;
  status?: 'active' | 'inactive';
}

export function ServiceCategoryFormModal({ open, category, onClose }: ServiceCategoryFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const isEditing = Boolean(category);

  const teamsQuery = useSupportTeams();
  const createMutation = useCreateServiceCategory();
  const updateMutation = useUpdateServiceCategory(category?.id ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  useEffect(() => {
    if (open) {
      if (category) {
        form.setFieldsValue({
          code: category.code,
          name: category.name,
          description: category.description,
          targetTeamId: category.targetTeamId ?? undefined,
          defaultPriority: category.defaultPriority,
          targetResolutionHours: category.targetResolutionHours,
          status: category.status,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          defaultPriority: 'P3',
          targetResolutionHours: 24,
          status: 'active',
        });
      }
    }
  }, [open, category, form]);

  const handleFinish = (values: FormValues) => {
    if (isEditing && category) {
      const payload: UpdateServiceCategoryPayload = {
        name: values.name.trim(),
        description: values.description.trim(),
        targetTeamId: values.targetTeamId || null,
        defaultPriority: values.defaultPriority,
        targetResolutionHours: values.targetResolutionHours,
        status: values.status ?? 'active',
      };
      updateMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      const payload: CreateServiceCategoryPayload = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description.trim(),
        targetTeamId: values.targetTeamId || null,
        defaultPriority: values.defaultPriority,
        targetResolutionHours: values.targetResolutionHours,
      };
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const teamOptions = (teamsQuery.data ?? []).map((t) => ({
    value: t.id,
    label: `${t.name} (${t.code})`,
  }));

  return (
    <Modal
      title={isEditing ? `Chỉnh sửa danh mục: ${category?.name}` : 'Thêm danh mục dịch vụ mới'}
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={null}
      width={600}
    >
      {mutationError && (
        <Alert
          type="error"
          showIcon
          message={normalizeError(mutationError).message}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        disabled={isPending}
      >
        <Form.Item
          name="name"
          label="Tên danh mục dịch vụ"
          rules={[{ required: true, message: 'Vui lòng nhập tên danh mục dịch vụ' }]}
        >
          <Input placeholder="Ví dụ: Mạng & Wi-Fi, Cài đặt phần mềm..." />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã danh mục (Viết hoa)"
          rules={[
            { required: true, message: 'Vui lòng nhập mã danh mục' },
            { max: 15, message: 'Mã danh mục tối đa 15 ký tự' },
          ]}
        >
          <Input
            placeholder="Ví dụ: NET, VPN, SW, HW, ACC..."
            disabled={isEditing}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả phạm vi dịch vụ"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Mô tả các yêu cầu / sự cố thuộc danh mục dịch vụ này..."
          />
        </Form.Item>

        <Form.Item
          name="targetTeamId"
          label="Đội hỗ trợ tiếp nhận mặc định"
          extra="Hệ thống sẽ tự động đề xuất phân phối phiếu thuộc danh mục này về đội được chọn."
        >
          <Select
            placeholder="Chọn đội hỗ trợ tiếp nhận (tùy chọn)"
            allowClear
            showSearch
            optionFilterProp="label"
            loading={teamsQuery.isPending}
            options={teamOptions}
          />
        </Form.Item>

        <Form.Item
          name="defaultPriority"
          label="Mức độ ưu tiên mặc định"
          rules={[{ required: true, message: 'Chọn độ ưu tiên mặc định' }]}
        >
          <Select
            options={[
              { value: 'P1', label: 'P1 - Khẩn cấp / Nghiêm trọng' },
              { value: 'P2', label: 'P2 - Cao' },
              { value: 'P3', label: 'P3 - Trung bình' },
              { value: 'P4', label: 'P4 - Thấp' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="targetResolutionHours"
          label="Thời hạn cam kết xử lý SLA (Giờ)"
          rules={[{ required: true, message: 'Nhập thời hạn cam kết SLA' }]}
          extra="Thời gian tối đa cam kết hoàn thành xử lý sự cố kể từ khi tiếp nhận."
        >
          <InputNumber min={1} max={720} style={{ width: '100%' }} />
        </Form.Item>

        {isEditing && (
          <Form.Item
            name="status"
            label="Trạng thái cung cấp"
          >
            <Select
              options={[
                { value: 'active', label: 'Đang cung cấp' },
                { value: 'inactive', label: 'Tạm ngừng cung cấp' },
              ]}
            />
          </Form.Item>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending} style={{ borderRadius: 6 }}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
