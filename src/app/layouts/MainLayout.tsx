import { Button, Layout, Menu, Space } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getNavigation } from '../navigation/navigationConfig';

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getNavigation(user?.roles ?? []);
  const selected = items.find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`));
  return <Layout style={{ minHeight: '100vh' }}>
    <Layout.Header style={{ background: '#fff', padding: '0 24px', height: 'auto' }}>
      <Space wrap style={{ width: '100%' }}>
        <Button type="link" onClick={() => navigate('/')}>AI IT Service Desk</Button>
        <Menu mode="horizontal" items={items} selectedKeys={selected ? [selected.key] : []} onClick={({ key }) => navigate(key)} style={{ minWidth: 460 }} />
        <span>Xin chào, {user?.fullName ?? user?.email}</span>
        <Button onClick={logout}>Đăng xuất</Button>
      </Space>
    </Layout.Header>
    <Layout.Content style={{ padding: 24 }}><Outlet /></Layout.Content>
  </Layout>;
}
