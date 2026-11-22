import { useEffect } from 'react';
import { Alert, Button, Form, Input, Modal, Select } from 'antd';
import { useUsers } from '@/features/auth';
import type { CreateDepartmentPayload, DepartmentItemDto, UpdateDepartmentPayload } from '../model/department.types';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartmentMutations';
import { normalizeError } from '@/shared/api/httpError';

interface DepartmentFormModalProps {
  open: boolean;
  department?: DepartmentItemDto | null;
  onClose: () => void;
}

interface FormValues {
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  status?: 'active' | 'inactive';
}

export function DepartmentFormModal({ open, department, onClose }: DepartmentFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const isEditing = Boolean(department);

  const usersQuery = useUsers();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment(department?.id ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  useEffect(() => {
    if (open) {
      if (department) {
        form.setFieldsValue({
          code: department.code,
          name: department.name,
          description: department.description ?? '',
          managerId: department.managerId ?? undefined,
          status: department.status ?? 'active',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 'active',
        });
      }
    }
  }, [open, department, form]);

  const handleFinish = (values: FormValues) => {
    if (isEditing && department) {
      const payload: UpdateDepartmentPayload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        managerId: values.managerId || null,
        status: values.status ?? 'active',
      };
      updateMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      const payload: CreateDepartmentPayload = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || null,
        managerId: values.managerId || null,
      };
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const userOptions = (usersQuery.data ?? []).map((u) => ({
    value: u.userId,
    label: u.fullName ?? `Người dùng (${u.userId.slice(0, 8)})`,
  }));

  return (
    <Modal
      title={isEditing ? `Chỉnh sửa phòng ban: ${department?.name}` : 'Thêm phòng ban mới'}
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={null}
      width={560}
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
          label="Tên phòng ban"
          rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
        >
          <Input placeholder="Ví dụ: Phòng Kế toán - Tài chính" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã phòng ban"
          rules={[
            { required: true, message: 'Vui lòng nhập mã phòng ban' },
            { max: 15, message: 'Mã phòng ban tối đa 15 ký tự' },
          ]}
        >
          <Input
            placeholder="Ví dụ: FIN, HR, IT, OPS..."
            disabled={isEditing}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả chức năng & nhiệm vụ"
        >
          <Input.TextArea
            rows={3}
            placeholder="Mô tả chức năng, nhiệm vụ của phòng ban..."
          />
        </Form.Item>

        <Form.Item
          name="managerId"
          label="Trưởng phòng ban / Người phụ trách"
        >
          <Select
            placeholder="Chọn người phụ trách (tùy chọn)"
            allowClear
            showSearch
            optionFilterProp="label"
            loading={usersQuery.isPending}
            options={userOptions}
          />
        </Form.Item>

        {isEditing && (
          <Form.Item
            name="status"
            label="Trạng thái"
          >
            <Select
              options={[
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Tạm ngừng' },
              ]}
            />
          </Form.Item>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending} style={{ borderRadius: 6 }}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo phòng ban'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
