import { Button, Input, Layout, Menu, Space, Typography } from 'antd';
import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  CheckSquareOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import type { Role } from '@/features/auth';
import { getNavigation } from '../navigation/navigationConfig';
import { ThemeSwitch } from './ThemeSwitch';
import { routeConfig } from '../router/routeConfig';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const roleLabels: Record<Role, string> = { Admin: 'Quản trị viên', Agent: 'Kỹ thuật viên', Requester: 'Người yêu cầu' };
const roleOrder: readonly Role[] = ['Admin', 'Agent', 'Requester'];
const menuIcons: Partial<Record<string, ReactNode>> = {
  [routeConfig.home.path]: <AppstoreOutlined />,
  [routeConfig.create.path]: <PlusCircleOutlined />,
  [routeConfig.tickets.path]: <CheckSquareOutlined />,
  [routeConfig.workspace.path]: <UnorderedListOutlined />,
  [routeConfig.knowledge.path]: <BookOutlined />,
  [routeConfig.knowledgeAdmin.path]: <BookOutlined />,
  [routeConfig.admin.path]: <SettingOutlined />,
};

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleText = roleOrder.filter((role) => user?.roles.includes(role)).map((role) => roleLabels[role]).join(' · ');
  // The menu, and its order, come from the role-based navigation: nothing is added per screen here.
  const menuItems = getNavigation(user?.roles ?? []).map((item) => ({
    key: item.key,
    label: item.label,
    icon: menuIcons[item.key] ?? <CheckSquareOutlined />,
  }));

  const selectedKey = menuItems.find(
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
            items={menuItems}
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
          <div style={{ color: 'var(--tx2)', fontSize: '11px', marginTop: '2px' }} data-testid="current-roles">
            {roleText || 'Chưa có vai trò'}
          </div>
        </div>
      </Sider>

      <Layout style={{ background: 'var(--bg)' }}>
        <Header
          style={{
            background: 'var(--sf)',
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
          {/* No search or notification endpoint exists yet, so both stay locked and say so. */}
          <div style={{ flex: 1, maxWidth: 420 }} title="Chưa hỗ trợ tìm kiếm">
            <Input
              disabled
              aria-label="Tìm kiếm (chưa hỗ trợ)"
              prefix={<SearchOutlined style={{ color: 'var(--tx3)' }} />}
              placeholder="Tìm kiếm: chưa hỗ trợ"
              style={{ borderRadius: 6, background: 'var(--sf2)' }}
            />
          </div>

          <Space size="middle" align="center">
            <ThemeSwitch />
            <Button
              type="text"
              disabled
              icon={<BellOutlined />}
              style={{ color: 'var(--tx2)' }}
              title="Thông báo: chưa hỗ trợ"
              aria-label="Thông báo (chưa hỗ trợ)"
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
