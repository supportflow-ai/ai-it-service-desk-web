import { Button, Input, Layout, Menu, Space, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  BellOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getNavigation } from '../navigation/navigationConfig';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = getNavigation(user?.roles ?? []);
  const isAgentOrAdmin = user?.roles.some((r) => r === 'Agent' || r === 'Admin');

  // Map icon cho từng route
  const getIcon = (key: string) => {
    if (key.includes('tickets')) return <CheckSquareOutlined />;
    if (key.includes('workspace')) return <AppstoreOutlined />;
    if (key.includes('admin')) return <SettingOutlined />;
    return <CheckSquareOutlined />;
  };

  const menuItems = [
    {
      key: '/',
      label: 'Tổng quan',
      icon: <AppstoreOutlined />,
    },
    {
      key: '/tickets/new',
      label: 'Tạo yêu cầu',
      icon: <PlusCircleOutlined />,
    },
    ...navItems.map((item) => ({
      key: item.key,
      label: item.label,
      icon: getIcon(item.key),
    })),
  ];

  // Loại bỏ trùng lặp nếu có
  const uniqueMenuItems = menuItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.key === item.key),
  );

  const selectedKey = uniqueMenuItems.find(
    (item) => location.pathname === item.key || (item.key !== '/' && location.pathname.startsWith(`${item.key}/`)),
  )?.key ?? location.pathname;

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sider
        width={220}
        theme="light"
        style={{
          borderRight: '1px solid var(--bd)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--bd2)' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--tx)',
              letterSpacing: '-0.3px',
            }}
          >
            Support<span style={{ color: 'var(--pr)' }}>Flow</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tx3)', marginTop: '2px' }}>
            IT Service Desk
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={uniqueMenuItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          />
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--bd)',
            background: 'var(--sf2)',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--tx)' }}>
            {user?.fullName ?? user?.email ?? 'Người dùng'}
          </div>
          <div style={{ color: 'var(--tx2)', fontSize: '11px', marginTop: '2px' }}>
            {isAgentOrAdmin ? 'Agent · Hạ tầng' : 'Người yêu cầu'}
          </div>
        </div>
      </Sider>

      <Layout style={{ background: 'var(--bg)' }}>
        <Header
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid var(--bd)',
            padding: '0 28px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ flex: 1, maxWidth: 420 }}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--tx3)' }} />}
              placeholder="Tìm ticket, bài viết…"
              style={{ borderRadius: 6, background: 'var(--sf2)' }}
            />
          </div>

          <Space size="middle" align="center">
            <Tag color="cyan" style={{ borderRadius: 4, margin: 0 }}>
              Production
            </Tag>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ color: 'var(--tx2)' }}
              title="Thông báo"
            />
            <Text style={{ fontSize: '13px', color: 'var(--tx2)' }}>
              Xin chào, <b>{user?.fullName ?? user?.email}</b>
            </Text>
            <Button
              icon={<LogoutOutlined />}
              onClick={logout}
              danger
              size="small"
              style={{ borderRadius: 6 }}
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: '24px 32px', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
