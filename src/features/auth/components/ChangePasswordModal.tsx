import { useState } from 'react';
import { Alert, Form, Input, Modal, message } from 'antd';
import { useChangePassword } from '../hooks/useChangePassword';
import { normalizeError } from '@/shared/api/httpError';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const changePasswordMutation = useChangePassword();

  const handleSubmit = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    setErrorMessage(null);
    try {
      const res = await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(res.message || 'Đổi mật khẩu thành công.');
      form.resetFields();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(normalizeError(err).message);
    }
  };

  return (
    <Modal
      title="Đổi mật khẩu"
      open={open}
      onCancel={() => {
        form.resetFields();
        setErrorMessage(null);
        onClose();
      }}
      okText="Lưu mật khẩu"
      cancelText="Hủy"
      confirmLoading={changePasswordMutation.isPending}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      {errorMessage && <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại.' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu hiện tại" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới.' },
            { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự.' },
          ]}
        >
          <Input.Password placeholder="Tối thiểu 8 ký tự" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới.' }]}
        >
          <Input.Password placeholder="Nhập lại mật khẩu mới" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
