import { Button, Form, Input } from 'antd';
import { PASSWORD_POLICY_MESSAGE } from '../lib/registerErrorMessage';

export interface AuthFormValues { email: string; password: string; fullName?: string }

export function AuthForm({ register = false, pending, onSubmit }: {
  register?: boolean;
  pending: boolean;
  onSubmit: (values: AuthFormValues) => Promise<void>;
}) {
  return <Form<AuthFormValues> layout="vertical" onFinish={onSubmit} disabled={pending}>
    {register && <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' }]}>
      <Input autoComplete="name" />
    </Form.Item>}
    <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập Email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
      <Input autoComplete="username" />
    </Form.Item>
    <Form.Item name="password" label="Mật khẩu" rules={[
      { required: true, message: 'Vui lòng nhập mật khẩu.' },
      // Mirrors the backend Identity password options: 8+ characters with upper, lower and a digit.
      ...(register ? [{ pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: PASSWORD_POLICY_MESSAGE }] : []),
    ]}>
      <Input.Password autoComplete={register ? 'new-password' : 'current-password'} />
    </Form.Item>
    <Button type="primary" htmlType="submit" block loading={pending}>{register ? 'Đăng ký' : 'Đăng nhập'}</Button>
  </Form>;
}
