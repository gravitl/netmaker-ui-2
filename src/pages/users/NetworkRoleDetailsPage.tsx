import { useStore } from '@/store/store';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  Input,
  Layout,
  List,
  Modal,
  notification,
  Row,
  Skeleton,
  Switch,
  Tabs,
  TabsProps,
  theme,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageProps } from '../../models/Page';
import './UsersPage.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { RsrcPermissionScope, UserRole } from '@/models/User';
import { resolveAppRoute } from '@/utils/RouteUtils';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import { getExtendedNode } from '@/utils/NodeUtils';
import { UsersPageTabs } from './UsersPage';

// const permissionsTabKey = 'permissions';
const vpnAccessTabKey = 'vpn-access';
const defaultTabKey = vpnAccessTabKey;

interface metadataFormValues {
  name: string;
  network: string;
  full_access: boolean;
}

interface permissionsFormValues {
  addHost: boolean;
  viewRags: boolean;
  createRags: boolean;
  updateRags: boolean;
  deleteRags: boolean;
  connectRags: boolean;
  viewClients: boolean;
  createClients: boolean;
  updateClients: boolean;
  deleteClients: boolean;
  connectClients: boolean;
}

type vpnAccessFormValues = {
  [key: string]: boolean;
};

export default function NetworkRoleDetailsPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();

  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metadataForm] = Form.useForm<metadataFormValues>();
  const [permissionsForm] = Form.useForm<permissionsFormValues>();
  const [vpnAccessForm] = Form.useForm<vpnAccessFormValues>();
  const [activeTab, setActiveTab] = useState(defaultTabKey);
  const [canUpdate, setCanUpdate] = useState(false);
  const [searchRag, setSearchRag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form.useWatch(() => {
  //   setCanUpdate(true);
  // }, permissionsForm);
  // Form.useWatch(() => {
  //   setCanUpdate(true);
  // }, vpnAccessForm);

  const networkRags = useMemo(() => {
    return store.nodes
      .filter((n) => (n.network === role?.network_id || role?.network_id === 'all_networks') && n.isingressgateway)
      .map((n) => getExtendedNode(n, store.hostsCommonDetails));
  }, [role?.network_id, store.hostsCommonDetails, store.nodes]);

  const filteredRags = useMemo(() => {
    const ret = networkRags.filter((rag) => rag.name?.toLowerCase().includes(searchRag.toLowerCase()));
    return ret;
  }, [networkRags, searchRag]);

  const loadDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!roleId) {
        navigate(resolveAppRoute(AppRoutes.USERS_ROUTE));
        return;
      }
      // load from backend
      const role = (await UsersService.getRole(roleId)).data.Response;
      setRole(role);
    } catch (e: any) {
      notification.error({ message: 'Failed to load network role', description: extractErrorMsg(e) });
      navigate(resolveAppRoute(AppRoutes.USERS_ROUTE));
    } finally {
      setIsLoading(false);
    }
  }, [roleId, navigate]);

  const updateNetworkRole = useCallback(async () => {
    try {
      if (!role) {
        notify.error({ message: 'An error occured. Cannot update role' });
        return;
      }
      setIsSubmitting(true);
      const metadata = await metadataForm.validateFields();
      const permissions = await permissionsForm.validateFields();
      const vpnAccess = await vpnAccessForm.validateFields();
      UsersService.updateRole({
        ...role,
        // default: false,
        // denyDashboardAccess: false,
        full_access: metadata.full_access,
        // globalLevelAccess: null,
        network_level_access: {
          remote_access_gw: {
            // all_remote_access_gw: {
            //   create: permissions.createRags,
            //   read: permissions.viewRags,
            //   update: permissions.updateRags,
            //   delete: permissions.deleteRags,
            //   vpn_access: permissions.connectRags,
            //   self_only: true,
            // },
            ...Object.keys(vpnAccess).reduce(
              (acc, key) => {
                if (vpnAccess[key]) {
                  acc[key] = {
                    create: false,
                    read: true,
                    update: false,
                    delete: false,
                    vpn_access: true,
                    // vpn_access: permissions.connectRags,
                    self_only: true,
                  };
                }
                return acc;
              },
              {} as { [k: string]: RsrcPermissionScope },
            ),
          },
          extclients: {
            all_extclients: {
              // create: permissions.createClients,
              // read: permissions.viewClients,
              // update: permissions.updateClients,
              // delete: permissions.deleteClients,
              // vpn_access: permissions.connectClients,
              create: true,
              read: true,
              update: true,
              delete: true,
              vpn_access: true,
              self_only: true,
            },
          },
        },
      });
      setCanUpdate(false);
      notification.success({ message: 'Network role updated successfully' });
    } catch (e: any) {
      notify.error({ message: 'Failed to update network role', description: extractErrorMsg(e) });
    } finally {
      setIsSubmitting(false);
    }
  }, [metadataForm, notify, permissionsForm, role, vpnAccessForm]);

  const confirmDeleteRole = useCallback(() => {
    if (!role) {
      notify.error({ message: 'An error occured. Cannot delete role' });
      return;
    }
    Modal.confirm({
      title: 'Delete Role',
      content: `Are you sure you want to delete the role "${role.ui_name || role.id}"? This will remove the role from all users/groups, and they will lose any associated permissions.`,
      onOk: async () => {
        try {
          await UsersService.deleteRole(role.ui_name || role.id);
          notification.success({ message: `Role "${role.id}" deleted` });
          navigate(resolveAppRoute(AppRoutes.USERS_ROUTE, { tab: UsersPageTabs.rolesTabKey }));
        } catch (error) {
          notify.error({ message: `Failed to delete role "${role.ui_name || role.id}"` });
        }
      },
    });
  }, [navigate, notify, role]);

  const fullAccessVal = Form.useWatch('full_access', metadataForm);

  // ui components
  // const getPermissionsContent = useMemo(() => {
  //   return (
  //     <>
  //       <Form form={permissionsForm} disabled={role?.default}>
  //         <Col xs={24}>
  //           {/* hosts */}
  //           {/* <Card
  //             size="small"
  //             title="Hosts"
  //             extra={
  //               <Button
  //                 type="link"
  //                 onClick={() => {
  //                   permissionsForm.setFieldsValue({
  //                     addHost: true,
  //                   });
  //                 }}
  //               >
  //                 Allow All
  //               </Button>
  //             }
  //             style={{ width: '100%', marginBottom: '2rem' }}
  //           >
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_add-host-to-net"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can add a host to the network</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="addHost"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={props.role.network_level_access?.hosts?.all_host?.create}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //           </Card> */}

  //           {/* remote access */}
  //           <Card
  //             size="small"
  //             title="Remote Access"
  //             extra={
  //               <Button
  //                 type="link"
  //                 onClick={() => {
  //                   permissionsForm.setFieldsValue({
  //                     viewRags: true,
  //                     createRags: true,
  //                     updateRags: true,
  //                     deleteRags: true,
  //                     connectRags: true,
  //                   });
  //                 }}
  //               >
  //                 Allow All
  //               </Button>
  //             }
  //             style={{ width: '100%', marginBottom: '2rem' }}
  //           >
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_view-rags"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can view remote access gateways</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="viewRags"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.remote_access_gw?.all_remote_access_gw?.read}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_create-rags"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can create remote access gateways</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="createRags"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.remote_access_gw?.all_remote_access_gw?.create}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_update-rags"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can update remote access gateways</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="updateRags"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.remote_access_gw?.all_remote_access_gw?.update}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_delete-rags"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can delete remote access gateways</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="deleteRags"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.remote_access_gw?.all_remote_access_gw?.delete}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_connect-rags"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can connect to remote access gateways</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="connectRags"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.remote_access_gw?.all_remote_access_gw?.vpn_access}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //           </Card>

  //           {/* vpn clients */}
  //           <Card
  //             size="small"
  //             title="VPN Clients"
  //             extra={
  //               <Button
  //                 type="link"
  //                 onClick={() => {
  //                   permissionsForm.setFieldsValue({
  //                     viewClients: true,
  //                     createClients: true,
  //                     updateClients: true,
  //                     deleteClients: true,
  //                     connectClients: true,
  //                   });
  //                 }}
  //               >
  //                 Allow All
  //               </Button>
  //             }
  //             style={{ width: '100%', marginBottom: '2rem' }}
  //           >
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_view-clients"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can view VPN clients</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="viewClients"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.extclients?.all_extclients?.read}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_create-clients"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can create VPN clients</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="createClients"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.extclients?.all_extclients?.create}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_update-clients"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can update VPN clients</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="updateClients"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.extclients?.all_extclients?.update}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_delete-clients"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can delete VPN clients</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="deleteClients"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.extclients?.all_extclients?.delete}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //             <Row
  //               style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
  //               data-nmui-intercom="new-network-role_connect-clients"
  //             >
  //               <Col xs={18}>
  //                 <Typography.Text>Can connect to VPN clients</Typography.Text>
  //               </Col>
  //               <Col xs={6} style={{ textAlign: 'end' }}>
  //                 <Form.Item
  //                   name="connectClients"
  //                   valuePropName="checked"
  //                   noStyle
  //                   initialValue={role?.network_level_access?.extclients?.all_extclients?.vpn_access}
  //                 >
  //                   <Switch />
  //                 </Form.Item>
  //               </Col>
  //             </Row>
  //           </Card>
  //         </Col>
  //       </Form>
  //     </>
  //   );
  // }, [permissionsForm, role?.network_level_access, themeToken.colorBorder]);

  const getVpnAccessContent = useMemo(() => {
    return (
      <>
        <Form form={vpnAccessForm} disabled={role?.default}>
          <Row style={{ marginBottom: '2rem' }}>
            <Col xs={20}>Select the Remote Access Gateways users with this role will be able to connect through</Col>
            <Col xs={4} style={{ textAlign: 'end' }}>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  vpnAccessForm.setFieldsValue(
                    filteredRags.reduce(
                      (acc, rag) => {
                        acc[rag.id] = true;
                        return acc;
                      },
                      {} as { [key: string]: boolean },
                    ),
                  );
                }}
              >
                Select All Gateways
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
                      <Form.Item
                        key={rag.id}
                        name={rag.id}
                        valuePropName="checked"
                        noStyle
                        initialValue={
                          role?.network_level_access?.remote_access_gw?.all_remote_access_gw?.vpn_access ||
                          (role?.network_level_access?.remote_access_gw as any)?.[rag.id]?.vpn_access
                        }
                      >
                        <Switch title="You cannot change this setting this in this app version" />
                      </Form.Item>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        rag.name
                          ? `${rag.name} ${role?.network_id === 'all_networks' ? `(Network: ${rag.network})` : ''}`
                          : ''
                      }
                      description={rag.metadata || 'No metadata available for this Gateway'}
                    />
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </Form>
      </>
    );
  }, [filteredRags, role, searchRag, vpnAccessForm]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      // {
      //   key: permissionsTabKey,
      //   label: 'Permissions',
      //   children: getPermissionsContent,
      // },
      {
        key: vpnAccessTabKey,
        label: 'VPN Access',
        children: getVpnAccessContent,
      },
    ],
    [
      getVpnAccessContent,
      //getPermissionsContent
    ],
  );

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <Layout.Content
      className="NetworkRoleDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active title className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding" style={{ borderBottom: `1px solid ${themeToken.colorBorder}` }}>
          <Col xs={24}>
            <Link to={resolveAppRoute(`${AppRoutes.USERS_ROUTE}`, { tab: UsersPageTabs.rolesTabKey })}>
              View All Roles
            </Link>
            <Row>
              <Col xs={18} lg={12}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  Network Role
                </Typography.Title>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row className="tabbed-page-row-padding" style={{ paddingBottom: '0px' }}>
          <Col xs={24}>
            <Typography.Title level={4}>General</Typography.Title>
          </Col>
          <Form
            form={metadataForm}
            layout="vertical"
            style={{ width: '100%' }}
            initialValues={{
              name: role?.id,
              network: { label: role?.network_id, value: role?.network_id },
            }}
            disabled={role?.default}
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="Role Name"
                  // rules={[{ required: true, whitespace: false }]}
                  style={{ width: '80%' }}
                >
                  <Typography.Text style={{ fontWeight: 'bold' }}>{role?.ui_name ?? ''}</Typography.Text>
                  <br />
                  <Typography.Text style={{ fontSize: '90%', fontWeight: 'light' }}>
                    (ID: {role?.id ?? ''})
                  </Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="network" label="Specify the network this role will apply to" style={{ width: '80%' }}>
                  <Typography.Text style={{ fontWeight: 'bold' }}>{role?.network_id ?? ''}</Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="full_access"
                  label="Have full access to the network"
                  rules={[{ required: true }]}
                  valuePropName="checked"
                  initialValue={role?.full_access}
                >
                  <Switch />
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
            {fullAccessVal && <Typography.Text>This role has full access to all network resources</Typography.Text>}
            {!fullAccessVal && <Tabs items={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key)} />}
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
            // height: canUpdate ? 'unset' : '0px',
            // opacity: canUpdate ? '1' : '0',
            transition: 'height, opacity 0.3s ease-in-out',
          }}
        >
          <Col xs={12}>
            <Button type="default" size="large" danger onClick={confirmDeleteRole}>
              <DeleteOutlined /> Delete Role
            </Button>
          </Col>
          <Col xs={12} style={{ textAlign: 'end' }}>
            <Button
              type="primary"
              size="large"
              loading={isSubmitting}
              onClick={updateNetworkRole}
              title={role?.default ? 'Cannot update default roles' : undefined}
              disabled={role?.default}
            >
              <EditOutlined /> Update Role
            </Button>
          </Col>
        </Row>
      </Skeleton>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
