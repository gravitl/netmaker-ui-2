import { useStore } from '@/store/store';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  List,
  notification,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  TableColumnProps,
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
import { RsrcPermissionScope, User, UserGroup, UserRolePermissionTemplate } from '@/models/User';
import { resolveAppRoute } from '@/utils/RouteUtils';
import { Link, useNavigate } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import { Network } from '@/models/Network';
import { NetworksService } from '@/services/NetworksService';
import { convertNetworkPayloadToUiNetwork } from '@/utils/NetworkUtils';
import { getExtendedNode } from '@/utils/NodeUtils';
import AddUsersToGroupModal from '@/components/modals/add-users-to-group-modal/AddUsersToGroupModal';

interface metadataFormValues {
  name: string;
  autoAssign: boolean;
  metadata: string;
}

interface networkRolesFormValues {
  [key: Network['netid']]: UserRolePermissionTemplate['id'];
}

interface NetworkRolesTableData {
  network_id: UserRolePermissionTemplate['network_id'];
  network_roles: UserRolePermissionTemplate['id'][];
}

export default function CreateUserGroupPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();
  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const navigate = useNavigate();

  const [metadataForm] = Form.useForm<metadataFormValues>();
  const [networkRolesForm] = Form.useForm<networkRolesFormValues>();
  const [availbleNetworks, setAvailbleNetworks] = useState<Network[]>([]);
  const [availableUserRoles, setAvailableUserRoles] = useState<UserRolePermissionTemplate[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const [membersSearch, setMembersSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);

  const filteredMembers = useMemo(() => {
    return groupMembers.filter((m) => m.username?.toLowerCase().includes(membersSearch.trim().toLowerCase()));
  }, [groupMembers, membersSearch]);

  const networkRolesTableData = useMemo<NetworkRolesTableData[]>(() => {
    return availbleNetworks.map((network) => ({
      network_id: network.netid,
      network_roles: availableUserRoles.filter((role) => role.network_id === network.netid).map((role) => role.id),
    }));
  }, [availbleNetworks, availableUserRoles]);

  const networkRolesTableCols = useMemo<TableColumnProps<NetworkRolesTableData>[]>(
    () => [
      {
        title: 'Network',
        dataIndex: 'network_id',
        width: '30%',
        // render: (network: string) => <Typography.Text>{network}</Typography.Text>,
      },
      {
        title: 'Role',
        render: (_, rowData) => (
          <Form.Item name={rowData.network_id} noStyle>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a role for this network"
              options={[
                { label: 'n/a', value: '' },
                ...rowData.network_roles.map((role) => ({ label: role, value: role })),
              ]}
            />
          </Form.Item>
        ),
      },
    ],
    [],
  );

  const groupMembersTableCols = useMemo<TableColumnProps<User>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'username',
        render: (name: string) => <Typography.Text>{name}</Typography.Text>,
      },
      {
        title: '',
        width: '1rem',
        render: (_, rowData) => (
          <Button
            type="text"
            danger
            size="small"
            onClick={() => setGroupMembers(groupMembers.filter((m) => m.username !== rowData.username))}
          >
            Remove
          </Button>
        ),
      },
    ],
    [groupMembers],
  );

  const loadNetworks = useCallback(async () => {
    try {
      const networks = (await NetworksService.getNetworks()).data;
      setAvailbleNetworks(networks.map(convertNetworkPayloadToUiNetwork));
    } catch (e: any) {
      notify.error({ message: 'Failed to load networks. Reload page', description: extractErrorMsg(e) });
    } finally {
      setIsLoadingNetworks(false);
    }
  }, [notify]);

  const loadRoles = useCallback(async () => {
    try {
      const roles = (await UsersService.getRoles()).data.Response;
      setAvailableUserRoles(roles);
    } catch (e: any) {
      notify.error({ message: 'Failed to load roles. Reload page', description: extractErrorMsg(e) });
    }
  }, [notify]);

  const createGroup = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const metadata = await metadataForm.validateFields();
      const networkRoles = await networkRolesForm.validateFields();
      // const vpnAccess = await vpnAccessForm.validateFields();

      console.log('networkRoles', networkRoles);

      const networkRolesPayload = Object.keys(networkRoles).reduce(
        (acc, nw) => {
          if (networkRoles[nw]) acc[nw] = { [networkRoles[nw]]: {} };
          return acc;
        },
        {} as UserGroup['network_roles'],
      );

      console.log('networkRolesPayload', networkRolesPayload);

      await UsersService.createGroup({
        id: metadata.name,
        network_roles: networkRolesPayload,
        meta_data: metadata.metadata,
        // platform_role: 'user',
      });

      notification.success({ message: 'User group created successfully' });
      navigate(resolveAppRoute(AppRoutes.USERS_ROUTE));
    } catch (e: any) {
      notify.error({ message: 'Failed to create user group', description: extractErrorMsg(e) });
    } finally {
      setIsSubmitting(false);
    }
  }, [metadataForm, navigate, networkRolesForm, notify]);

  useEffect(() => {
    loadNetworks();
    loadRoles();
  }, [loadNetworks, loadRoles]);

  return (
    <Layout.Content
      className="CreateUserGroupPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoadingNetworks} active title className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding" style={{ borderBottom: `1px solid ${themeToken.colorBorder}` }}>
          <Col xs={24}>
            <Link to={resolveAppRoute(AppRoutes.USERS_ROUTE)}>View All Groups</Link>
            <Row>
              <Col xs={18} lg={12}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  Create a User Group
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
                  label="Group Name"
                  rules={[{ required: true, whitespace: false }]}
                  style={{ width: '80%' }}
                >
                  <Input placeholder="Enter a name for this new group" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="auto-assign" label="Auto-assign on startup">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="metadata" label="Group Description" style={{ width: '80%' }}>
                  <Input.TextArea placeholder="Enter a description for this new group" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Row>

        <Row className="tabbed-page-row-padding" style={{ paddingBottom: '5rem' }}>
          <Col xs={24}>
            <Card size="small" title="Associated Network Roles" style={{ width: '100%', marginBottom: '2rem' }}>
              <Form form={networkRolesForm}>
                <Row style={{ padding: '.5rem 0rem' }} data-nmui-intercom="new-group_network-roles">
                  <Col xs={24}>
                    <Table
                      size="small"
                      columns={networkRolesTableCols}
                      dataSource={networkRolesTableData}
                      pagination={false}
                      scroll={{ x: 'auto' }}
                    />
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>
        </Row>

        <Row className="tabbed-page-row-padding" style={{ paddingBottom: '5rem' }}>
          <Col xs={24}>
            <Card
              size="small"
              title="Associated Network Roles"
              style={{ width: '100%', marginBottom: '2rem' }}
              extra={
                <Button size="small" onClick={() => setIsAddUserModalOpen(true)}>
                  <PlusOutlined /> Add User
                </Button>
              }
            >
              <Row style={{ padding: '.5rem 0rem' }} data-nmui-intercom="new-group_network-roles">
                <Col xs={24}>
                  <Table
                    size="small"
                    columns={groupMembersTableCols}
                    dataSource={groupMembers}
                    pagination={{ pageSize: 25 }}
                  />
                </Col>
              </Row>
            </Card>
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
            <Button type="primary" size="large" loading={isSubmitting} onClick={createGroup}>
              <PlusOutlined /> Create Group
            </Button>
          </Col>
        </Row>
      </Skeleton>

      {/* misc */}
      {notifyCtx}

      {/* modals */}
      <AddUsersToGroupModal
        isOpen={isAddUserModalOpen}
        onCancel={() => setIsAddUserModalOpen(false)}
        currentGroupMembers={groupMembers}
        onUserSelected={(user) => {
          setGroupMembers([...new Set([...groupMembers, user])]);
        }}
      />
    </Layout.Content>
  );
}
