import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { useResetPassword } from '../hooks/useResetPassword';
import { normalizeError } from '@/shared/api/httpError';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  const handleRequestOtp = async (values: { email: string }) => {
    setErrorMessage(null);
    try {
      await forgotPasswordMutation.mutateAsync({ email: values.email });
      setEmail(values.email);
      setStep('reset');
    } catch (err: unknown) {
      setErrorMessage(normalizeError(err).message);
    }
  };

  const handleResetPassword = async (values: { otpCode: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }
    setErrorMessage(null);
    try {
      await resetPasswordMutation.mutateAsync({ email, otpCode: values.otpCode, newPassword: values.newPassword });
      setStep('success');
    } catch (err: unknown) {
      setErrorMessage(normalizeError(err).message);
    }
  };

  return (
    <Card style={{ width: 400, margin: '48px auto' }}>
      <Typography.Title level={2}>Quên mật khẩu</Typography.Title>
      {errorMessage && <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: 16 }} />}

      {step === 'request' && (
        <Form onFinish={handleRequestOtp} layout="vertical">
          <Typography.Paragraph type="secondary">
            Nhập email tài khoản của bạn để nhận mã OTP đặt lại mật khẩu.
          </Typography.Paragraph>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email.' },
              { type: 'email', message: 'Email không đúng định dạng.' },
            ]}
          >
            <Input placeholder="example@domain.com" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={forgotPasswordMutation.isPending} block style={{ marginBottom: 16 }}>
            Gửi mã OTP
          </Button>
        </Form>
      )}

      {step === 'reset' && (
        <Form onFinish={handleResetPassword} layout="vertical">
          <Typography.Paragraph type="secondary">
            Mã OTP đã được gửi đến <b>{email}</b>. Vui lòng nhập mã OTP và mật khẩu mới.
          </Typography.Paragraph>
          <Form.Item
            name="otpCode"
            label="Mã OTP"
            rules={[{ required: true, message: 'Vui lòng nhập mã OTP.' }]}
          >
            <Input placeholder="Nhập mã OTP gồm 6 chữ số" />
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
          <Button type="primary" htmlType="submit" loading={resetPasswordMutation.isPending} block style={{ marginBottom: 16 }}>
            Đặt lại mật khẩu
          </Button>
        </Form>
      )}

      {step === 'success' && (
        <div>
          <Alert
            type="success"
            showIcon
            message="Đặt lại mật khẩu thành công"
            description="Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ."
            style={{ marginBottom: 16 }}
          />
          <Button type="primary" block onClick={() => navigate('/login')}>
            Đăng nhập ngay
          </Button>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Link to="/login">Quay lại đăng nhập</Link>
      </div>
    </Card>
  );
}
