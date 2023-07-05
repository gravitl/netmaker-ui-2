import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DatabaseOutlined,
  GlobalOutlined,
  KeyOutlined,
  LaptopOutlined,
  LogoutOutlined,
  // MobileOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Col, MenuProps, Row, Select, Switch, Typography } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getAmuiUrl, getHostRoute, getNetworkRoute } from '../utils/RouteUtils';
import { useStore } from '../store/store';
import { AppRoutes } from '@/routes';
import { useTranslation } from 'react-i18next';
import { isSaasBuild } from '@/services/BaseService';
import { ServerConfigService } from '@/services/ServerConfigService';

const { Content, Sider } = Layout;

const SIDE_NAV_EXPANDED_WIDTH = '200px';
const SIDE_NAV_COLLAPSED_WIDTH = '80px';

// const SELECTED_COLOR = '#1668dc';

export default function MainLayout() {
  const { token: themeToken } = theme.useToken();
  const currentTheme = useStore((state) => state.currentTheme);
  const setCurrentTheme = useStore((state) => state.setCurrentTheme);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const store = useStore();
  const storeFetchNetworks = useStore((state) => state.fetchNetworks);
  const storeLogout = useStore((state) => state.logout);
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const recentNetworks = useMemo(
    // TODO: implement most recent ranking
    () =>
      structuredClone(store.networks)
        .sort((a, b) => a.netid.localeCompare(b.netid))
        .slice(0, 5),
    [store.networks]
  );

  const sideNavItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          key: 'dashboard',
          icon: DatabaseOutlined,
          label: 'Dashboard',
        },
        {
          key: 'networks',
          icon: GlobalOutlined,
          label: 'Networks',
          children: [
            ...recentNetworks.map((net) => ({
              key: `networks/${net.netid}`,
              label: net.netid,
            })),
            {
              type: 'divider',
            },
            {
              key: 'all-networks',
              label: 'All Networks',
            },
          ],
        },
        {
          key: 'hosts',
          icon: LaptopOutlined,
          label: 'Hosts',
        },
        // {
        //   key: 'clients',
        //   icon: MobileOutlined,
        //   label: 'Clients',
        // },
        {
          key: 'enrollment-keys',
          icon: KeyOutlined,
          label: 'Enrollment Keys',
        },
        {
          type: 'divider',
        },
      ]
        .concat(
          isSaasBuild
            ? [
                {
                  key: 'amui',
                  icon: UserOutlined,
                  label: 'Manage Account',
                },
              ]
            : [
                // {
                //   key: 'users',
                //   icon: UserOutlined,
                //   label: 'Users',
                // },
              ]
        )
        .concat(
          isSaasBuild || store.user?.isadmin
            ? [
                {
                  key: 'users',
                  icon: UserOutlined,
                  label: 'Users',
                },
              ]
            : []
        )
        .map((item) => ({
          key: item.key,
          type: item.type as any,
          style: {
            marginTop: item.type === 'divider' ? '1rem' : '',
            marginBottom: item.type === 'divider' ? '1rem' : '',
          },
          icon: item.icon && React.createElement(item.icon),
          label: item.label,
          children: item.children?.map((child) => ({
            key: (child as any)?.key,
            label: (child as any)?.label,
            type: (child as any)?.type,
          })),
        })),
    [recentNetworks, store.user?.isadmin]
  );

  const sideNavBottomItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          icon: UserOutlined,
          label: store.username,
        },
      ].map((item, index) => ({
        key: String(index + 1),
        icon: React.createElement(item.icon),
        label: item.label,
        children: [
          {
            style: {
              paddingLeft: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingRight: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingTop: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingBottom: isSidebarCollapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Dark theme
                <Switch
                  checked={currentTheme === 'dark'}
                  onClick={() => {
                    setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark');
                  }}
                />
              </div>
            ),
          },
          {
            style: {
              paddingLeft: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingRight: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingTop: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingBottom: isSidebarCollapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <GlobalOutlined />
                <Select
                  style={{ width: '100%' }}
                  value={i18n.language}
                  options={[
                    {
                      label: (
                        <>
                          <img
                            style={{ width: '20px', height: '12px' }}
                            src="https://img.freepik.com/free-vector/illustration-uk-flag_53876-18166.jpg?w=1800&t=st=1679225900~exp=1679226500~hmac=0cc9ee0d4d5196bb3c610ca92d669f3c0ebf95431423a2c4ff7196f81c10891e"
                            alt="english"
                            loading="eager"
                            referrerPolicy="no-referrer"
                          />{' '}
                          English
                        </>
                      ),
                      value: 'en',
                    },
                    // { label: 'French', value: 'fr' },
                  ]}
                  onChange={(value) => {
                    i18n.changeLanguage(value);
                  }}
                />
              </div>
            ),
          },
          {
            style: {
              paddingLeft: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingRight: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingTop: isSidebarCollapsed ? '.2rem' : '1rem',
              paddingBottom: isSidebarCollapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  gap: '1rem',
                  alignItems: 'center',
                }}
                onClick={() => {
                  storeLogout();
                  navigate(AppRoutes.LOGIN_ROUTE);
                }}
              >
                <LogoutOutlined /> Logout
              </div>
            ),
          },
        ],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSidebarCollapsed, currentTheme, i18n.language, navigate, setCurrentTheme, store.username, storeLogout]
  );

  const getActiveSideNavKeys = useCallback(() => {
    if (location.pathname === AppRoutes.NETWORKS_ROUTE) {
      return ['networks', 'all-networks'];
    } else if (location.pathname === AppRoutes.HOSTS_ROUTE) {
      return ['hosts', 'all-hosts'];
    } else if (location.pathname === AppRoutes.CLIENTS_ROUTE) {
      return ['clients'];
    } else if (location.pathname === AppRoutes.ENROLLMENT_KEYS_ROUTE) {
      return ['enrollment-keys'];
    } else if (location.pathname === AppRoutes.DASHBOARD_ROUTE) {
      return ['dashboard'];
    } else if (location.pathname === AppRoutes.USERS_ROUTE) {
      return ['users'];
    }
  }, [location.pathname]);

  useEffect(() => {
    storeFetchNetworks();
  }, [storeFetchNetworks]);

  return (
    <Layout hasSider>
      <Sider
        collapsible
        collapsed={isSidebarCollapsed}
        onCollapse={(value) => setIsSidebarCollapsed(value)}
        width={SIDE_NAV_EXPANDED_WIDTH}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: `1px solid ${themeToken.colorBorder}`,
        }}
      >
        {/* logo */}
        <Link to={AppRoutes.DASHBOARD_ROUTE}>
          <img
            src={isSidebarCollapsed ? `/logo-small-${store.currentTheme}.png` : `/logo-${store.currentTheme}.png`}
            alt="logo"
            style={{ width: '100%', padding: '1rem 2rem 1rem 2rem' }}
          />
        </Link>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={getActiveSideNavKeys()}
          items={sideNavItems}
          defaultOpenKeys={['networks', 'hosts']}
          style={{ borderRight: 'none' }}
          onClick={(menu) => {
            switch (menu.key) {
              case 'dashboard':
                navigate(AppRoutes.DASHBOARD_ROUTE);
                break;
              case 'all-networks':
                navigate(AppRoutes.NETWORKS_ROUTE);
                break;
              case 'hosts':
                navigate(AppRoutes.HOSTS_ROUTE);
                break;
              case 'clients':
                navigate(AppRoutes.CLIENTS_ROUTE);
                break;
              case 'enrollment-keys':
                navigate(AppRoutes.ENROLLMENT_KEYS_ROUTE);
                break;
              case 'amui':
                window.location = getAmuiUrl() as any;
                break;
              case 'users':
                navigate(AppRoutes.USERS_ROUTE);
                break;
              default:
                if (menu.key.startsWith('networks/')) {
                  navigate(getNetworkRoute(menu.key.replace('networks/', '')));
                } else if (menu.key.startsWith('hosts/')) {
                  navigate(getHostRoute(menu.key.replace('hosts/', '')));
                }
                break;
            }
          }}
        />

        {/* server version */}
        {!isSidebarCollapsed && (
          <div style={{ marginTop: '1rem', padding: '0rem 1.5rem', fontSize: '.8rem' }}>
            <Typography.Text style={{ fontSize: 'inherit' }}>UI: {ServerConfigService.getUiVersion()}</Typography.Text>
            <br />
            <Typography.Text style={{ fontSize: 'inherit' }} type="secondary">
              Server: {store.serverConfig?.Version ?? 'n/a'}
            </Typography.Text>
          </div>
        )}

        {/* bottom items */}
        <Menu
          theme="light"
          mode="inline"
          selectable={false}
          items={sideNavBottomItems}
          style={{ borderRight: 'none', position: 'absolute', bottom: '0' }}
        />
      </Sider>

      {/* main content */}
      <Layout
        style={{
          transition: 'all 200ms',
          marginLeft: isSidebarCollapsed ? SIDE_NAV_COLLAPSED_WIDTH : SIDE_NAV_EXPANDED_WIDTH,
        }}
      >
        <Content style={{ background: themeToken.colorBgContainer, overflow: 'initial', minHeight: '100vh' }}>
          {/* server status indicator */}
          {!store.serverStatus.isHealthy && (
            <Row>
              <Col xs={24}>
                <Alert
                  type="warning"
                  showIcon
                  style={{ border: 'none', height: '4rem', fontSize: '1rem', color: '#D4B106' }}
                  message={
                    !store.serverStatus.status?.healthyNetwork
                      ? 'Unable to react Netmaker server. Check you internet connection.'
                      : 'Your Netmaker server is not running properly. This may impact network performance. Contact your administrator.'
                  }
                />
              </Col>
            </Row>
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
