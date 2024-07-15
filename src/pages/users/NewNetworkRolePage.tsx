import { useStore } from '@/store/store';
import {
  CheckOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  Layout,
  List,
  MenuProps,
  Modal,
  notification,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  TableColumnsType,
  Tabs,
  TabsProps,
  Tag,
  theme,
  Tour,
  TourProps,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageProps } from '../../models/Page';
import './UsersPage.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { User } from '@/models/User';
import AddUserModal from '@/components/modals/add-user-modal/AddUserModal';
import UpdateUserModal from '@/components/modals/update-user-modal/UpdateUserModal';
import { isSaasBuild } from '@/services/BaseService';
import { getAmuiUrl, resolveAppRoute } from '@/utils/RouteUtils';
import TransferSuperAdminRightsModal from '@/components/modals/transfer-super-admin-rights/TransferSuperAdminRightsModal';
import { useBranding } from '@/utils/Utils';
import RolesPage from './RolesPage';
import GroupsPage from './GroupsPage';
import { Link } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import { Network } from '@/models/Network';
import { NetworksService } from '@/services/NetworksService';
import { convertNetworkPayloadToUiNetwork } from '@/utils/NetworkUtils';
import { getExtendedNode } from '@/utils/NodeUtils';

const USERS_DOCS_URL = 'https://docs.netmaker.io/pro/pro-users.html';

const permissionsTabKey = 'permissions';
const vpnAccessTabKey = 'vpn-access';
const defaultTabKey = permissionsTabKey;

export default function NewNetworkRolePage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const branding = useBranding();
  const { token: themeToken } = theme.useToken();
  const isServerEE = store.serverConfig?.IsEE === 'yes';

  const [metadataForm] = Form.useForm();
  const [permissionsForm] = Form.useForm();
  const [vpnAccessForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState(defaultTabKey);
  const [availbleNetworks, setAvailbleNetworks] = useState<Network[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const [searchRag, setSearchRag] = useState('');

  const networkVal = Form.useWatch('network', metadataForm);

  const networkRags = useMemo(() => {
    const r = store.nodes
      .filter((n) => (n.network === networkVal || '') && n.isingressgateway)
      .map((n) => getExtendedNode(n, store.hostsCommonDetails));
    return r;
  }, [networkVal, store.hostsCommonDetails, store.nodes]);

  const filteredRags = useMemo(() => {
    const r = networkRags.filter((rag) => rag.name?.toLowerCase().includes(searchRag.toLowerCase()));
    console.log(r);
    return r;
  }, [networkRags, searchRag]);

  const loadNetworks = useCallback(async () => {
    try {
      const networks = (await NetworksService.getNetworks()).data;
      setAvailbleNetworks(networks.map(convertNetworkPayloadToUiNetwork));
    } catch (e: any) {
      notify.error({ message: extractErrorMsg(e) });
    } finally {
      setIsLoadingNetworks(false);
    }
  }, [notify]);

  // ui components
  const getPermissionsContent = useCallback(() => {
    return (
      <>
        <Form form={permissionsForm}>
          <Col xs={24}>
            {/* hosts */}
            <Card
              size="small"
              title="Hosts"
              extra={<Button type="link">Toggle All</Button>}
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_add-host-to-net"
              >
                <Col xs={18}>
                  <Typography.Text>Can add a host to the network</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="addHost" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* remote access */}
            <Card
              size="small"
              title="Remote Access"
              extra={<Button type="link">Toggle All</Button>}
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_view-rags"
              >
                <Col xs={18}>
                  <Typography.Text>Can view remote access gateways</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="viewRags" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_create-rags"
              >
                <Col xs={18}>
                  <Typography.Text>Can create remote access gateways</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="createRags" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_update-rags"
              >
                <Col xs={18}>
                  <Typography.Text>Can update remote access gateways</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="updateRags" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_delete-rags"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete remote access gateways</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="deleteRags" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_connect-rags"
              >
                <Col xs={18}>
                  <Typography.Text>Can connect to remote access gateways</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="connectRags" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* vpn clients */}
            <Card
              size="small"
              title="VPN Clients"
              extra={<Button type="link">Toggle All</Button>}
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_view-clients"
              >
                <Col xs={18}>
                  <Typography.Text>Can view VPN clients</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="viewClients" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_create-clients"
              >
                <Col xs={18}>
                  <Typography.Text>Can create VPN clients</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="createClients" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_update-clients"
              >
                <Col xs={18}>
                  <Typography.Text>Can update VPN clients</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="updateClients" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_delete-clients"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete VPN clients</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="deleteClients" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-network-role_connect-clients"
              >
                <Col xs={18}>
                  <Typography.Text>Can connect to VPN clients</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item name="connectClients" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Form>
      </>
    );
  }, [permissionsForm, themeToken.colorBorder]);

  const getVpnAccessContent = useCallback(() => {
    return (
      <>
        {!networkVal && (
          <div className="" style={{ textAlign: 'center', height: '100%' }}>
            <Typography.Text>Please select a network</Typography.Text>
          </div>
        )}
        {!!networkVal && (
          <Form form={vpnAccessForm}>
            <Row style={{ marginBottom: '2rem' }}>
              <Col xs={20}>Select the Remote Access Gateways users with this role will be able to connect through</Col>
              <Col xs={4} style={{ textAlign: 'end' }}>
                <Button type="primary" size="small">
                  Select All
                </Button>
              </Col>
              <Col xs={24} style={{ paddingTop: '1rem' }}>
                <Input
                  placeholder="Search Remote Access Gateways..."
                  allowClear
                  value={searchRag}
                  onChange={(ev) => setSearchRag(ev.target.value)}
                />
              </Col>
            </Row>
            <Row style={{ marginBottom: '2rem' }}>
              <Col xs={24}>
                <List
                  bordered
                  itemLayout="horizontal"
                  dataSource={filteredRags}
                  renderItem={(rag) => (
                    <List.Item
                      actions={[
                        <Switch key={rag.id} checked title="You cannot change this setting this in this app version" />,
                      ]}
                    >
                      <List.Item.Meta
                        title={rag.name ?? ''}
                        description={rag.metadata || 'No metadata available for this Gateway'}
                      />
                    </List.Item>
                  )}
                />
              </Col>
            </Row>
          </Form>
        )}
      </>
    );
  }, [filteredRags, networkVal, searchRag, vpnAccessForm]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: permissionsTabKey,
        label: 'Permissions',
        children: getPermissionsContent(),
      },
      {
        key: vpnAccessTabKey,
        label: 'Network Administration',
        children: getVpnAccessContent(),
      },
    ],
    [getVpnAccessContent, getPermissionsContent],
  );

  useEffect(() => {
    loadNetworks();
  }, [isServerEE, loadNetworks]);

  return (
    <Layout.Content
      className="NewNetworkRolePage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoadingNetworks} active title className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding" style={{ borderBottom: `1px solid ${themeToken.colorBorder}` }}>
          <Col xs={24}>
            <Link to={resolveAppRoute(AppRoutes.USERS_ROUTE)}>View All Roles</Link>
            <Row>
              <Col xs={18} lg={12}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  Create a Network Role
                </Typography.Title>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row className="tabbed-page-row-padding" style={{ paddingBottom: '0px' }}>
          <Col xs={24}>
            <Typography.Title level={4}>General</Typography.Title>
          </Col>
          <Form form={metadataForm} layout="vertical" style={{ width: '100%' }}>
            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="Role Name"
                  rules={[{ required: true, whitespace: false }]}
                  style={{ width: '80%' }}
                >
                  <Input placeholder="Enter a name for this new role" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="network"
                  label="Specify the network this role will apply to"
                  rules={[{ required: true }]}
                  style={{ width: '80%' }}
                >
                  <Select
                    options={availbleNetworks.map((n) => ({ label: n.netid, value: n.netid }))}
                    placeholder="Select a network"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Row>

        <Row className="tabbed-page-row-padding" style={{ paddingBottom: '5rem' }}>
          <Col xs={24}>
            <Typography.Title level={4}>Role Permissions</Typography.Title>
          </Col>
          <Col xs={24}>
            <Tabs items={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key)} />
          </Col>
        </Row>

        <Row
          className="tabbed-page-row-padding"
          style={{
            position: 'fixed',
            bottom: 0,
            zIndex: 999,
            width: `calc(100% - ${store.sidebarWidth})`,
            backgroundColor: themeToken.colorBgContainer,
            borderTop: `1px solid ${themeToken.colorBorder}`,
          }}
        >
          <Col xs={24} style={{ textAlign: 'end' }}>
            <Button type="primary" size="large">
              Create Role
            </Button>
          </Col>
        </Row>
      </Skeleton>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
