import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Switch,
  theme,
  Drawer,
} from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarcodeOutlined,
  TagsOutlined,
  UserOutlined,
  HistoryOutlined,
  BarChartOutlined,
  SunOutlined,
  MoonOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { token: themeToken } = theme.useToken();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const primaryColor = company?.colors?.primary || '#1677ff';
  const siderWidth = collapsed ? 80 : 250;

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Tableau de bord' },
    ...(!isSuperAdmin
      ? [
          { key: '/products', icon: <BarcodeOutlined />, label: 'Produits' },
          { key: '/categories', icon: <TagsOutlined />, label: 'Catégories' },
          { key: '/sales', icon: <ShoppingCartOutlined />, label: 'Ventes' },
          { key: '/sales/new', icon: <InboxOutlined />, label: 'Point de vente' },
          { key: '/invoices', icon: <FileTextOutlined />, label: 'Factures' },
          { key: '/clients', icon: <TeamOutlined />, label: 'Clients' },
          { key: '/reports', icon: <BarChartOutlined />, label: 'Rapports' },
        ]
      : []),
    ...(isAdmin || isSuperAdmin
      ? [
          { key: '/users', icon: <UserOutlined />, label: 'Utilisateurs' },
          { key: '/activity', icon: <HistoryOutlined />, label: "Journal d'activité" },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          { type: 'divider' as const },
          { key: 'admin-title', label: 'ADMINISTRATION', type: 'group' as const },
          { key: '/admin/companies', icon: <ControlOutlined />, label: 'Entreprises' },
        ]
      : []),
    { key: '/settings', icon: <SettingOutlined />, label: 'Paramètres' },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    const matched = menuItems.find((item) => {
      if (!item.key) return false;
      if (item.key === '/') return path === '/';
      return path.startsWith(item.key);
    });
    return matched?.key || '/';
  };

  const handleMenuClick = (info: { key: string }) => {
    navigate(info.key);
    if (isMobile) setMobileDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userDropdownItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Déconnexion',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const sidebarContent = (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: isDarkMode ? '#141414' : '#fff' }}
    >
      <div
        className="flex items-center justify-center h-16 border-b shrink-0"
        style={{ borderColor: isDarkMode ? '#303030' : '#f0f0f0' }}
      >
        {collapsed && !isMobile ? (
          <Text strong className="text-lg" style={{ color: primaryColor }}>
            SF
          </Text>
        ) : (
          <Space>
            <Text strong className="text-base" style={{ color: primaryColor }}>
              {company?.name || 'StockFlow'}
            </Text>
          </Space>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={[]}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-r-0 flex-1 overflow-y-auto"
        style={{ backgroundColor: 'transparent' }}
      />
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          className="fixed left-0 top-0 bottom-0 z-10 overflow-hidden"
          style={{
            backgroundColor: isDarkMode ? '#141414' : '#fff',
            borderRight: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
          }}
        >
          {sidebarContent}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          title={
            <Text strong style={{ color: primaryColor }}>
              {company?.name || 'StockFlow'}
            </Text>
          }
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={250}
          styles={{ body: { padding: 0 } }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : siderWidth,
          transition: 'margin-left 0.2s ease',
        }}
      >
        <Header
          className="flex items-center justify-between px-4 md:px-6 sticky top-0 z-20"
          style={{
            backgroundColor: isDarkMode ? '#141414' : '#fff',
            borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
            height: 64,
            paddingInline: isMobile ? 16 : 24,
          }}
        >
          <Space>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
          </Space>

          <Space size="middle" align="center">
            <Button
              type="text"
              icon={<BellOutlined className="text-lg" />}
            />

            <Space align="center" size={4}>
              {isDarkMode ? (
                <MoonOutlined style={{ fontSize: 14, color: isDarkMode ? '#faad14' : undefined }} />
              ) : (
                <SunOutlined style={{ fontSize: 14 }} />
              )}
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                size="small"
              />
            </Space>

            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" trigger={['click']}>
              <Space className="cursor-pointer" align="center">
                <Avatar
                  style={{
                    backgroundColor: primaryColor,
                    verticalAlign: 'middle',
                    cursor: 'pointer',
                  }}
                  size="small"
                >
                  {user?.firstName?.[0]?.toUpperCase()}
                  {user?.lastName?.[0]?.toUpperCase()}
                </Avatar>
                <Text className="hidden md:inline text-sm">
                  {user?.firstName} {user?.lastName}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content className="p-4 md:p-6" style={{ minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>

        <Footer
          className="text-center text-xs"
          style={{
            backgroundColor: isDarkMode ? '#141414' : '#fafafa',
            borderTop: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
            padding: '12px 24px',
          }}
        >
          {company?.name || 'StockFlow'} &copy; {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
