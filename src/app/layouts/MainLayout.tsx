import { useState } from 'react';
import { Button, Input, Layout, Menu, Space } from 'antd';
import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  CheckSquareOutlined,
  KeyOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChangePasswordModal, useAuth } from '@/features/auth';
import type { Role } from '@/features/auth';
import { getNavigation } from '../navigation/navigationConfig';
import { ThemeSwitch } from './ThemeSwitch';
import { routeConfig } from '../router/routeConfig';

const { Sider, Header, Content } = Layout;

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
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  // Below the `lg` breakpoint (tablet) the sidebar folds to icons so the page keeps its width.
  const [collapsed, setCollapsed] = useState(false);

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
        collapsedWidth={72}
        breakpoint="lg"
        collapsed={collapsed}
        onBreakpoint={setCollapsed}
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
        <div style={{ padding: collapsed ? '18px 8px 12px' : '18px 20px 12px', borderBottom: '1px solid var(--bd2)', textAlign: collapsed ? 'center' : undefined }}>
          <div
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--pr)',
            }}
          >
            <span style={{ fontSize: 20, margin: collapsed ? '0 auto' : undefined }} aria-label="SupportFlow" title="SupportFlow">{collapsed ? 'SF' : 'SupportFlow'}</span>
          </div>
          {!collapsed && (
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
              Hệ thống hỗ trợ IT nội bộ
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            inlineCollapsed={collapsed}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          />
        </div>

        {user && !collapsed && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--bd2)',
              fontSize: 12,
              background: 'var(--sf)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName ?? user.email}
            </div>
            <div style={{ color: 'var(--tx3)', fontSize: 11, marginTop: 2 }} data-testid="current-roles">
              {roleText || 'Chưa có vai trò'}
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        <Header
          style={{
            background: 'var(--sf)',
            borderBottom: '1px solid var(--bd)',
            padding: '0 24px',
            gap: 16,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* No search or notification endpoint exists yet, so both stay locked and say so. */}
          <div className="app-header-search" style={{ flex: 1, maxWidth: 420 }} title="Chưa hỗ trợ tìm kiếm">
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
            <Button
              type="link"
              icon={<UserOutlined />}
              onClick={() => navigate(routeConfig.account.path)}
              className="app-greeting"
              style={{ fontSize: '13px', color: 'var(--tx2)' }}
              aria-label="Hồ sơ cá nhân"
            >
              Xin chào, <b>{user?.fullName ?? user?.email}</b>
            </Button>
            <Button
              icon={<KeyOutlined />}
              onClick={() => setOpenPasswordModal(true)}
              size="small"
              style={{ borderRadius: 6 }}
            >
              Đổi mật khẩu
            </Button>
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

      <ChangePasswordModal open={openPasswordModal} onClose={() => setOpenPasswordModal(false)} />
    </Layout>
  );
}
