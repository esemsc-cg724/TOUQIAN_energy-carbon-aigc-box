// src/features/auth/ui/logout-menu.tsx

import { DownOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, type MenuProps } from 'antd';
import { useNavigate } from 'react-router';

import { clearAuthSession, getAuthSession } from '../application/auth-session';

const CHATBOT_LOGIN_REDIRECT_PATH = '/login?redirect=/ppt-risk-report/chatbot-embed';

export function LogoutMenu() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const userLabel = session ? `账号 ${session.accountId}` : '已登录';

  const menuItems: MenuProps['items'] = [
    {
      danger: true,
      icon: <LogoutOutlined />,
      key: 'logout',
      label: '退出登录',
    },
  ];

  function handleMenuClick({ key }: { key: string }) {
    if (key !== 'logout') {
      return;
    }

    clearAuthSession();
    navigate(CHATBOT_LOGIN_REDIRECT_PATH, { replace: true });
  }

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      placement="bottomRight"
      trigger={['click']}
    >
      <button
        aria-label="用户菜单"
        className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:border-cyan-400 hover:text-cyan-700"
        type="button"
      >
        <Avatar icon={<UserOutlined />} size={24} />
        <span className="max-w-24 truncate">{userLabel}</span>
        <DownOutlined className="text-xs" />
      </button>
    </Dropdown>
  );
}
