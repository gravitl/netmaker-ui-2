import React, { useMemo, useState } from 'react';
import { AppstoreOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Col, Divider, Input, List, MenuProps, Row, Select, Switch } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import VirtualList from 'rc-virtual-list';
import { Network } from '../models/Network';
import { Host } from '../models/Host';
import { getHostRoute } from '../utils/RouteUtils';
import { useStore } from '../store/store';
import { AppRoutes } from '@/routes';
import { useTranslation } from 'react-i18next';
import { Typography } from 'antd';

const { Content, Sider } = Layout;

const sideNavItems: MenuProps['items'] = [
  {
    key: 'dashboard',
    icon: UserOutlined,
    label: 'Dashboard',
  },
  {
    key: 'remote-access',
    icon: AppstoreOutlined,
    label: 'Remote Access',
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

const dummyNets: Network[] = [
  { netid: 'home' },
  { netid: 'fast-net' },
  { netid: 'test-net' },
  { netid: 'arpanet' },
  { netid: 'internet' },
] as Network[];

const dummyHosts: Host[] = [
  { id: '123', name: 'Home Ubuntu' },
  { id: '1234', name: 'Office Mac' },
  { id: '12', name: "Kid's Windows" },
] as Host[];

const NETWORKS_LIST_HEIGHT = 200;
const HOSTS_LIST_HEIGHT = 200;

export default function MainLayout() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const currentTheme = useStore((state) => state.currentTheme);
  const setCurrentTheme = useStore((state) => state.setCurrentTheme);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const store = useStore();

  const [collapsed, setCollapsed] = useState(false);
  const [networks, setNetworks] = useState(dummyNets);
  const [hosts, setHosts] = useState(dummyHosts);

  const sideNavBottomItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          icon: UserOutlined,
          // TODO: get username
          label: 'Aceix',
        },
      ].map((item, index) => ({
        key: String(index + 1),
        icon: React.createElement(item.icon),
        label: item.label,
        children: [
          {
            style: {
              padding: collapsed ? '.2rem' : '1rem',
            },
            label: (
              <div
                style={{
                  display: 'flex',
                  flexFlow: 'row nowrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
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
              padding: collapsed ? '.2rem' : '1rem',
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
              >
                <GlobalOutlined />
                <Select
                  style={{ width: '100%' }}
                  defaultValue="en"
                  options={[
                    {
                      label: (
                        <>
                          <img
                            style={{ width: '20px', height: '12px' }}
                            src="https://img.freepik.com/free-vector/illustration-uk-flag_53876-18166.jpg?w=1800&t=st=1679225900~exp=1679226500~hmac=0cc9ee0d4d5196bb3c610ca92d669f3c0ebf95431423a2c4ff7196f81c10891e"
                            alt="english"
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
        ],
      })),
    [collapsed, currentTheme, i18n, setCurrentTheme]
  );

  // TODO: optimise how sidenav renders when collapsed
  return (
    <Layout hasSider>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
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
          defaultSelectedKeys={['1']}
          items={sideNavItems}
          style={{ borderRight: 'none' }}
          onClick={(menu) => {
            switch (menu.key) {
              case 'dashboard':
                navigate(AppRoutes.HOME_ROUTE);
                break;
            }
          }}
        />

        {/* networks */}
        <Row align="middle" style={{ marginLeft: '28px', marginRight: '8px' }}>
          <Col xs={12} style={{ height: '2rem' }}>
            <Link to={AppRoutes.NETWORKS_ROUTE}>Networks</Link>
          </Col>
          <Col xs={12} style={{ height: '2rem' }}>
            <Divider style={{ marginTop: '.7rem', marginBottom: '0px' }} />
          </Col>
          <Col xs={24}>
            <Input placeholder="Search network..." size="small" />
          </Col>
        </Row>
        <List>
          <VirtualList data={networks} height={NETWORKS_LIST_HEIGHT} itemHeight={30} itemKey="netid">
            {(network: Network) => (
              <List.Item key={network.netid} style={{ borderBottom: 'none', height: '30px' }}>
                <List.Item.Meta
                  style={{ fontWeight: 'normal', height: '30px' }}
                  title={<Link to={'#'}>{network.netid}</Link>}
                />
              </List.Item>
            )}
          </VirtualList>
        </List>

        {/* hosts */}
        <Row align="middle" style={{ marginLeft: '28px', marginRight: '8px' }}>
          <Col xs={12} style={{ height: '2rem' }}>
            <Link to={AppRoutes.HOSTS_ROUTE}>Hosts</Link>
          </Col>
          <Col xs={12} style={{ height: '2rem' }}>
            <Divider style={{ marginTop: '.7rem', marginBottom: '0px' }} />
          </Col>
          <Col xs={24}>
            <Input placeholder="Search hosts..." size="small" />
          </Col>
        </Row>
        <List>
          <VirtualList data={hosts} height={HOSTS_LIST_HEIGHT} itemHeight={30} itemKey="id">
            {(host: Host) => (
              <List.Item key={host.id} style={{ borderBottom: 'none', height: '30px' }}>
                <List.Item.Meta
                  style={{ fontWeight: 'normal', height: '30px' }}
                  title={<Link to={getHostRoute(host)}>{host.name}</Link>}
                />
              </List.Item>
            )}
          </VirtualList>
        </List>

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
          marginLeft: collapsed ? SIDE_NAV_COLLAPSED_WIDTH : SIDE_NAV_EXPANDED_WIDTH,
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
