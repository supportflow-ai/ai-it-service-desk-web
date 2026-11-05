import { Button, Dropdown } from 'antd';
import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useThemeMode } from '../providers/themeMode';
import type { ThemePreference } from '../providers/themeMode';

const themeOptions: Record<ThemePreference, { label: string; icon: ReactNode }> = {
  light: { label: 'Sáng', icon: <SunOutlined /> },
  dark: { label: 'Tối', icon: <MoonOutlined /> },
  system: { label: 'Theo hệ thống', icon: <DesktopOutlined /> },
};

/** Light, dark or the system setting; shared by the signed-in header and the public landing page. */
export function ThemeSwitch() {
  const { preference, setPreference } = useThemeMode();
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectable: true,
        selectedKeys: [preference],
        items: (Object.keys(themeOptions) as ThemePreference[]).map((key) => ({
          key, label: themeOptions[key].label, icon: themeOptions[key].icon,
        })),
        onClick: ({ key }) => setPreference(key as ThemePreference),
      }}
    >
      <Button
        type="text"
        icon={themeOptions[preference].icon}
        style={{ color: 'var(--tx2)' }}
        title={`Giao diện: ${themeOptions[preference].label}`}
        aria-label={`Giao diện: ${themeOptions[preference].label}`}
      />
    </Dropdown>
  );
}
