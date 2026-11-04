import { Alert, Card, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useRegister } from '../hooks/useRegister';
import { describeRegisterError } from '../lib/registerErrorMessage';

export function RegisterPage() {
  const register = useRegister();
  const navigate = useNavigate();
  return <Card style={{ width: 400, margin: '48px auto' }}>
    <Typography.Title level={2}>Đăng ký tài khoản</Typography.Title>
    {register.error && <Alert type="error" showIcon message={describeRegisterError(register.error)} style={{ marginBottom: 16 }} />}
    <AuthForm register pending={register.isPending} onSubmit={async (values) => {
      if (!values.fullName) return;
      try {
        await register.mutateAsync({ email: values.email, password: values.password, fullName: values.fullName });
        navigate('/login', { replace: true });
      } catch { /* The mutation error is rendered above. */ }
    }} />
    <Link to="/login">Đăng nhập ngay</Link>
  </Card>;
}
