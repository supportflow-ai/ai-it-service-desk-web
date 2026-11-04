import { Alert, Card, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { describeLoginError } from '../lib/loginErrorMessage';
import { isRecord } from '@/shared/lib/guards';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state: unknown = location.state;
  const from = isRecord(state) && isRecord(state.from) && typeof state.from.pathname === 'string'
    && state.from.pathname.startsWith('/') && !state.from.pathname.startsWith('//') ? state.from.pathname : '/';
  const loginError = auth.loginError ? describeLoginError(auth.loginError) : null;
  return <Card style={{ width: 400, margin: '48px auto' }}>
    <Typography.Title level={2}>Đăng nhập</Typography.Title>
    {loginError && <Alert type="error" showIcon message={loginError} style={{ marginBottom: 16 }} />}
    <AuthForm pending={auth.loginPending} onSubmit={async (values) => {
      try { await auth.login(values); navigate(from, { replace: true }); }
      catch { /* The mutation error is rendered above. */ }
    }} />
    <Link to="/register">Đăng ký ngay</Link>
  </Card>;
}
