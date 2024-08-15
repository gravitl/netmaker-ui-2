import { useStore } from '@/store/store';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
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

const hostsTabKey = 'hosts';
const networksTabKey = 'networks';
const enrollmentKeysTabKey = 'enrollment-keys';
const usersTabKey = 'users-access';
const defaultTabKey = hostsTabKey;

interface metadataFormValues {
  name: string;
  network: string;
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

export default function PlatformRoleDetailsPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();

  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metadataForm] = Form.useForm<metadataFormValues>();
  const [hostsPermissionsForm] = Form.useForm<permissionsFormValues>();
  const [networksPermissionsForm] = Form.useForm<vpnAccessFormValues>();
  const [enrollmentKeysPermissionsForm] = Form.useForm<vpnAccessFormValues>();
  const [usersPermissionsForm] = Form.useForm<vpnAccessFormValues>();
  const [activeTab, setActiveTab] = useState(defaultTabKey);
  const [canUpdate, setCanUpdate] = useState(false);
  const [searchRag, setSearchRag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullAccessVal = Form.useWatch('full_access', metadataForm);

  // Form.useWatch(() => {
  //   setCanUpdate(true);
  // }, permissionsForm);
  // Form.useWatch(() => {
  //   setCanUpdate(true);
  // }, vpnAccessForm);

  const networkRags = useMemo(() => {
    return store.nodes
      .filter((n) => (n.network === role?.network_id || '') && n.isingressgateway)
      .map((n) => getExtendedNode(n, store.hostsCommonDetails));
  }, [role?.network_id, store.hostsCommonDetails, store.nodes]);

  const filteredRags = useMemo(() => {
    return networkRags.filter((rag) => rag.name?.toLowerCase().includes(searchRag.toLowerCase()));
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

  // const updatePlatformRole = useCallback(async () => {
  //   try {
  //     if (!role) {
  //       notify.error({ message: 'An error occured. Cannot update role' });
  //       return;
  //     }
  //     setIsSubmitting(true);
  //     const permissions = await hostsPermissionsForm.validateFields();
  //     const vpnAccess = await vpnAccessForm.validateFields();
  //     UsersService.updateRole({
  //       ...role,
  //       // default: false,
  //       // denyDashboardAccess: false,
  //       // fullAccess: false,
  //       // globalLevelAccess: null,
  //       network_level_access: {
  //         remote_access_gw: {
  //           all_remote_access_gw: {
  //             create: permissions.createRags,
  //             read: permissions.viewRags,
  //             update: permissions.updateRags,
  //             delete: permissions.deleteRags,
  //             vpn_access: permissions.connectRags,
  //           },
  //           ...Object.keys(vpnAccess).reduce(
  //             (acc, key) => {
  //               if (vpnAccess[key]) {
  //                 acc[key] = {
  //                   create: false,
  //                   read: false,
  //                   update: false,
  //                   delete: false,
  //                   vpn_access: permissions.connectRags,
  //                 };
  //               }
  //               return acc;
  //             },
  //             {} as { [k: string]: RsrcPermissionScope },
  //           ),
  //         },
  //         extclients: {
  //           all_extclients: {
  //             create: permissions.createClients,
  //             read: permissions.viewClients,
  //             update: permissions.updateClients,
  //             delete: permissions.deleteClients,
  //             vpn_access: permissions.connectClients,
  //           },
  //         },
  //       },
  //     });
  //     setCanUpdate(false);
  //     notification.success({ message: 'Network role created successfully' });
  //   } catch (e: any) {
  //     notify.error({ message: 'Failed to create network role', description: extractErrorMsg(e) });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // }, [notify, hostsPermissionsForm, role, vpnAccessForm]);

  const confirmDeleteRole = useCallback(() => {
    if (!role) {
      notify.error({ message: 'An error occured. Cannot delete role' });
      return;
    }
    Modal.confirm({
      title: 'Delete Role',
      content: `Are you sure you want to delete the role "${role.id}"? This will remove the role from all users/groups, and they will lose any associated permissions.`,
      onOk: async () => {
        try {
          await UsersService.deleteRole(role.id);
          notification.success({ message: `Role "${role.id}" deleted` });
          navigate(resolveAppRoute(AppRoutes.USERS_ROUTE));
        } catch (error) {
          notify.error({ message: `Failed to delete role "${role.id}"` });
        }
      },
    });
  }, [navigate, notify, role]);

  // ui components
  const getHostsContent = useMemo(() => {
    return (
      <>
        <Form form={hostsPermissionsForm}>
          <Col xs={24}>
            {/* hosts */}
            <Card
              size="small"
              // extra={
              //   <Button
              //     type="link"
              //     onClick={() => {
              //       permissionsForm.setFieldsValue({
              //         viewRags: true,
              //         createRags: true,
              //         updateRags: true,
              //         deleteRags: true,
              //         connectRags: true,
              //       });
              //     }}
              //   >
              //     Allow All
              //   </Button>
              // }
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_register-hosts"
              >
                <Col xs={18}>
                  <Typography.Text>Can register new hosts</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="createHosts"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.hosts?.all_host?.create}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_update-hosts"
              >
                <Col xs={18}>
                  <Typography.Text>Can update hosts</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="updateHosts"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.hosts?.all_host?.update}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_delete-hosts"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete hosts</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="deleteHosts"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.hosts?.all_host?.delete}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_join-hosts"
              >
                <Col xs={18}>
                  <Typography.Text>Can join hosts to networks</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="joinHosts"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.hosts?.all_host?.create}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_remove-hosts"
              >
                <Col xs={18}>
                  <Typography.Text>Can remove hosts from networks</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="removeHosts"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.hosts?.all_host?.update}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Form>
      </>
    );
  }, [hostsPermissionsForm, role, themeToken.colorBorder]);

  const getNetworksContent = useMemo(() => {
    return (
      <>
        <Form form={networksPermissionsForm}>
          <Col xs={24}>
            {/* networks */}
            <Card
              size="small"
              // extra={
              //   <Button
              //     type="link"
              //     onClick={() => {
              //       permissionsForm.setFieldsValue({
              //         viewRags: true,
              //         createRags: true,
              //         updateRags: true,
              //         deleteRags: true,
              //         connectRags: true,
              //       });
              //     }}
              //   >
              //     Allow All
              //   </Button>
              // }
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_create-networks"
              >
                <Col xs={18}>
                  <Typography.Text>Can create networks</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="createNetworks"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.networks?.all_network?.create}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_view-networks"
              >
                <Col xs={18}>
                  <Typography.Text>Can view networks</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="viewNetworks"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.networks?.all_network?.read}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_update-networks"
              >
                <Col xs={18}>
                  <Typography.Text>Can update networks</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="updateNetworks"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.networks?.all_network?.update}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_delete-networks"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete networks</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="deleteNetworks"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.networks?.all_network?.delete}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Form>
      </>
    );
  }, [networksPermissionsForm, role, themeToken.colorBorder]);

  const getEnrollmenKeysContent = useMemo(() => {
    return (
      <>
        <Form form={enrollmentKeysPermissionsForm}>
          <Col xs={24}>
            {/* enrollment-keys */}
            <Card
              size="small"
              // extra={
              //   <Button
              //     type="link"
              //     onClick={() => {
              //       permissionsForm.setFieldsValue({
              //         viewRags: true,
              //         createRags: true,
              //         updateRags: true,
              //         deleteRags: true,
              //         connectRags: true,
              //       });
              //     }}
              //   >
              //     Allow All
              //   </Button>
              // }
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_create-enrollment-key"
              >
                <Col xs={18}>
                  <Typography.Text>Can create enrollment key</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="createEnrollmentKeys"
                    valuePropName="checked"
                    noStyle
                    initialValue={
                      role?.full_access || role?.global_level_access?.enrollment_key?.all_enrollment_key?.create
                    }
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_update-enrollment-keys"
              >
                <Col xs={18}>
                  <Typography.Text>Can update enrollment keys</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="updateEnrollmentKeys"
                    valuePropName="checked"
                    noStyle
                    initialValue={
                      role?.full_access || role?.global_level_access?.enrollment_key?.all_enrollment_key?.update
                    }
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_delete-enrollment-keys"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete enrollment keys</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="deleteEnrollmentKeys"
                    valuePropName="checked"
                    noStyle
                    initialValue={
                      role?.full_access || role?.global_level_access?.enrollment_key?.all_enrollment_key?.delete
                    }
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Form>
      </>
    );
  }, [enrollmentKeysPermissionsForm, role, themeToken.colorBorder]);

  const getUsersContent = useMemo(() => {
    return (
      <>
        <Form form={usersPermissionsForm}>
          <Col xs={24}>
            {/* users */}
            <Card
              size="small"
              // extra={
              //   <Button
              //     type="link"
              //     onClick={() => {
              //       permissionsForm.setFieldsValue({
              //         viewRags: true,
              //         createRags: true,
              //         updateRags: true,
              //         deleteRags: true,
              //         connectRags: true,
              //       });
              //     }}
              //   >
              //     Allow All
              //   </Button>
              // }
              style={{ width: '100%', marginBottom: '2rem' }}
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_create-users"
              >
                <Col xs={18}>
                  <Typography.Text>Can create users</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="createUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.create}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_update-users"
              >
                <Col xs={18}>
                  <Typography.Text>Can update users</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="updateUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.update}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_delete-users"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete users</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="deleteUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.delete}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_create-user-groups"
              >
                <Col xs={18}>
                  <Typography.Text>Can create user groups</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="createUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.create}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_view-user-groups"
              >
                <Col xs={18}>
                  <Typography.Text>Can view user groups</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="viewUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.read}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_update-user-groups"
              >
                <Col xs={18}>
                  <Typography.Text>Can update user groups</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="updateUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.update}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_delete-user-groups"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete user groups</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="deleteUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.delete}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_create-user-roles"
              >
                <Col xs={18}>
                  <Typography.Text>Can create user roles</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="createUserRoles"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.create}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_view-user-roles"
              >
                <Col xs={18}>
                  <Typography.Text>Can view user roles</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="viewUserRoles"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.read}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_update-user-roles"
              >
                <Col xs={18}>
                  <Typography.Text>Can update user roles</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="updateUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.update}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="new-platform-role_delete-user-roles"
              >
                <Col xs={18}>
                  <Typography.Text>Can delete user roles</Typography.Text>
                </Col>
                <Col xs={6} style={{ textAlign: 'end' }}>
                  <Form.Item
                    name="deleteUsers"
                    valuePropName="checked"
                    noStyle
                    initialValue={role?.full_access || role?.global_level_access?.users?.all_user?.delete}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Form>
      </>
    );
  }, [usersPermissionsForm, role, themeToken.colorBorder]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: hostsTabKey,
        label: 'Hosts Permissions Access',
        children: getHostsContent,
      },
      {
        key: networksTabKey,
        label: 'Networks Permisisons Access',
        children: getNetworksContent,
      },
      {
        key: enrollmentKeysTabKey,
        label: 'Enrollment Keys Access',
        children: getHostsContent,
      },
      {
        key: usersTabKey,
        label: 'Users Permisisons Access',
        children: getUsersContent,
      },
    ],
    [getHostsContent, getNetworksContent, getUsersContent],
  );

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <Layout.Content
      className="PlatformRoleDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active title className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding" style={{ borderBottom: `1px solid ${themeToken.colorBorder}` }}>
          <Col xs={24}>
            <Link to={resolveAppRoute(AppRoutes.USERS_ROUTE)}>View All Roles</Link>
            <Row>
              <Col xs={18} lg={12}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  Platform Access Level
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
            disabled
            style={{ width: '100%' }}
            initialValues={{
              name: role?.id,
              network: { label: role?.network_id, value: role?.network_id },
            }}
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="Role Name" style={{ width: '80%' }}>
                  <Typography.Text style={{ fontWeight: 'bold' }}>{role?.id ?? ''}</Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="default" label="Specify the network this role will apply to" style={{ width: '80%' }}>
                  <Typography.Text style={{ fontWeight: 'bold' }}>{role?.default ?? ''}</Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="deny_dashboard_access"
                  label="Has dashboard access"
                  style={{ width: '80%' }}
                  initialValue={role?.deny_dashboard_access}
                >
                  <Typography.Text style={{ fontWeight: 'bold' }}>
                    {role?.deny_dashboard_access ? 'No' : 'Yes'}
                  </Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="full_access"
                  label="Has full access to all tenant resources"
                  style={{ width: '80%' }}
                  initialValue={role?.full_access}
                >
                  <Typography.Text style={{ fontWeight: 'bold' }}>{role?.full_access ? 'Yes' : 'No'}</Typography.Text>
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
            {fullAccessVal && <Typography.Text>This role has full access to all tenant resources</Typography.Text>}
            <Tabs items={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key)} />
          </Col>
        </Row>

        {/* <Row
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
            <Button type="default" size="large" danger onClick={confirmDeleteRole} disabled={role?.default}>
              <DeleteOutlined /> Delete Role
            </Button>
          </Col>
          <Col xs={12} style={{ textAlign: 'end' }}>
            <Button
              type="primary"
              size="large"
              loading={isSubmitting}
              onClick={updateNetworkRole}
              // disabled={!canUpdate}
            >
              <EditOutlined /> Update Role
            </Button>
          </Col>
        </Row> */}
      </Skeleton>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
