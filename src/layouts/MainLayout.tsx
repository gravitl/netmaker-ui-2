import React, { useCallback, useMemo, useState } from 'react';
import { AppstoreOutlined, GlobalOutlined, LaptopOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Col, Divider, Input, List, MenuProps, Row, Select, Switch, Typography } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import VirtualList from 'rc-virtual-list';
import { Network } from '../models/Network';
import { Host } from '../models/Host';
import { getHostRoute, getNetworkRoute } from '../utils/RouteUtils';
import { useStore } from '../store/store';
import { AppRoutes } from '@/routes';
import { useTranslation } from 'react-i18next';

const { Content, Sider } = Layout;

const sideNavItems: MenuProps['items'] = [
  {
    key: 'dashboard',
    icon: UserOutlined,
    label: 'Dashboard',
  },
  {
    key: 'networks',
    icon: GlobalOutlined,
    label: 'Networks',
  },
  {
    key: 'hosts',
    icon: LaptopOutlined,
    label: 'Hosts',
  },
  {
    key: 'clients',
    icon: AppstoreOutlined,
    label: 'Clients',
  },
  {
    key: 'enrollment-keys',
    icon: AppstoreOutlined,
    label: 'Enrollment Keys',
  },
].map((item) => ({
  key: item.key,
  icon: React.createElement(item.icon),
  label: item.label,
}));

const SIDE_NAV_EXPANDED_WIDTH = '200px';
const SIDE_NAV_COLLAPSED_WIDTH = '80px';

const NETWORKS_LIST_HEIGHT = 200;
const HOSTS_LIST_HEIGHT = 200;
const selectedColor = '#1668dc';

export default function MainLayout() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const currentTheme = useStore((state) => state.currentTheme);
  const setCurrentTheme = useStore((state) => state.setCurrentTheme);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const store = useStore();
  const storeLogout = useStore((state) => state.logout);
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [networksSearch, setNetworksSearch] = useState('');
  const [hostsSearch, setHostsSearch] = useState('');

  const filteredNetworks = useMemo(
    () => store.networks.filter((network) => network.netid.toLowerCase().includes(networksSearch.toLowerCase())),
    [networksSearch, store.networks]
  );

  const filteredHosts = useMemo(
    () => store.hosts.filter((host) => host.name.toLowerCase().includes(hostsSearch.toLowerCase())),
    [hostsSearch, store.hosts]
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
                          />{' '}
                          English
                        </>
                      ),
                      value: 'en',
                    },
                    { label: 'French', value: 'fr' },
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
      return ['networks'];
    } else if (location.pathname === AppRoutes.HOSTS_ROUTE) {
      return ['hosts'];
    } else if (location.pathname === AppRoutes.CLIENTS_ROUTE) {
      return ['clients'];
    } else if (location.pathname === AppRoutes.ENROLLMENT_KEYS_ROUTE) {
      return ['enrollment-keys'];
    } else if (location.pathname === AppRoutes.DASHBOARD_ROUTE) {
      return ['dashboard'];
    }
  }, [location.pathname]);

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
        }}
      >
        {/* logo */}
        <img src="/src/assets/logo.png" alt="logo" style={{ width: '100%', padding: '1rem' }} />
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={getActiveSideNavKeys()}
          items={sideNavItems}
          style={{ borderRight: 'none' }}
          onClick={(menu) => {
            switch (menu.key) {
              case 'dashboard':
                navigate(AppRoutes.DASHBOARD_ROUTE);
                break;
              case 'networks':
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
              default:
                break;
            }
          }}
        />

        {/* networks */}
        {!isSidebarCollapsed && (
          <>
            <Row align="middle" style={{ marginTop: '2rem', marginLeft: '28px', marginRight: '8px' }}>
              <Col xs={18} style={{ height: '2rem' }}>
                <Typography.Text>Recent networks</Typography.Text>
              </Col>
              <Col xs={6} style={{ height: '2rem' }}>
                <Divider style={{ marginTop: '.7rem', marginBottom: '0px' }} />
              </Col>
              <Col xs={24}>
                <Input
                  placeholder="Search network..."
                  size="small"
                  value={networksSearch}
                  onChange={(ev) => setNetworksSearch(ev.target.value)}
                />
              </Col>
            </Row>
            <List>
              <VirtualList data={filteredNetworks} height={NETWORKS_LIST_HEIGHT} itemHeight={30} itemKey="netid">
                {(network: Network) => (
                  <List.Item key={network.netid} style={{ borderBottom: 'none', height: '30px' }}>
                    <List.Item.Meta
                      style={{
                        fontWeight: 'normal',
                        height: '30px',
                      }}
                      title={
                        <Link
                          to={getNetworkRoute(network)}
                          style={{ color: location.pathname === getNetworkRoute(network) ? selectedColor : undefined }}
                        >
                          {network.netid}
                        </Link>
                      }
                    />
                  </List.Item>
                )}
              </VirtualList>
            </List>
          </>
        )}

        {/* hosts */}
        {!isSidebarCollapsed && (
          <>
            <Row align="middle" style={{ marginLeft: '28px', marginRight: '8px' }}>
              <Col xs={18} style={{ height: '2rem' }}>
                <Typography.Text>Recent hosts</Typography.Text>
              </Col>
              <Col xs={6} style={{ height: '2rem' }}>
                <Divider style={{ marginTop: '.7rem', marginBottom: '0px' }} />
              </Col>
              <Col xs={24}>
                <Input
                  placeholder="Search hosts..."
                  size="small"
                  value={hostsSearch}
                  onChange={(ev) => setHostsSearch(ev.target.value)}
                />
              </Col>
            </Row>
            <List>
              <VirtualList data={filteredHosts} height={HOSTS_LIST_HEIGHT} itemHeight={30} itemKey="id">
                {(host: Host) => (
                  <List.Item key={host.id} style={{ borderBottom: 'none', height: '30px' }}>
                    <List.Item.Meta
                      style={{ fontWeight: 'normal', height: '30px' }}
                      title={
                        <Link
                          to={getHostRoute(host)}
                          style={{ color: location.pathname === getHostRoute(host) ? selectedColor : undefined }}
                        >
                          {host.name}
                        </Link>
                      }
                    />
                  </List.Item>
                )}
              </VirtualList>
            </List>
          </>
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
        <Content style={{ background: colorBgContainer, overflow: 'initial', minHeight: '100vh' }}>
          {/* server status indicator */}
          {!store.serverStatus.isHealthy && (
            <Row>
              <Col xs={24}>
                <Alert
                  type="warning"
                  showIcon
                  style={{ border: 'none', height: '4rem', fontSize: '1rem', color: '#D4B106' }}
                  message="Server error: Your Netmaker server is not running properly. This may impact network performance . Contact your
                  administrator."
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
