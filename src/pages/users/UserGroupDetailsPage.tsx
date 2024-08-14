import { useStore } from '@/store/store';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  notification,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  TableColumnProps,
  theme,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageProps } from '../../models/Page';
import './UsersPage.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { User, UserGroup, UserRole } from '@/models/User';
import { resolveAppRoute } from '@/utils/RouteUtils';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import { Network } from '@/models/Network';
import { NetworksService } from '@/services/NetworksService';
import { convertNetworkPayloadToUiNetwork } from '@/utils/NetworkUtils';
import AddUsersToGroupModal from '@/components/modals/add-users-to-group-modal/AddUsersToGroupModal';
import { deriveUserRoleType } from '@/utils/UserMgmtUtils';

interface metadataFormValues {
  name: string;
  autoAssign: boolean;
  metadata: string;
  platformRole: UserRole['id'];
}

interface networkRolesFormValues {
  [key: Network['netid']]: UserRole['id'];
}

interface NetworkRolesTableData {
  network_id: UserRole['network_id'];
  network_roles: UserRole['id'][];
}

export default function UserGroupDetailsPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();
  // const isServerEE = store.serverConfig?.IsEE === 'yes';
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  const [metadataForm] = Form.useForm<metadataFormValues>();
  const [networkRolesForm] = Form.useForm<networkRolesFormValues>();
  const [availbleNetworks, setAvailbleNetworks] = useState<Network[]>([]);
  const [availableUserRoles, setAvailableUserRoles] = useState<UserRole[]>([]);
  const [membersSearch, setMembersSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newGroupMembers, setNewGroupMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const loadDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!groupId) {
        navigate(resolveAppRoute(AppRoutes.USERS_ROUTE));
        return;
      }
      // load from backend
      const group = (await UsersService.getGroup(groupId)).data.Response;
      setGroup(group);
    } catch (e: any) {
      notification.error({ message: 'Failed to load group details', description: extractErrorMsg(e) });
      navigate(resolveAppRoute(AppRoutes.USERS_ROUTE));
    } finally {
      setIsLoading(false);
    }
  }, [groupId, navigate]);

  const loadUsers = useCallback(async () => {
    try {
      const users = (await UsersService.getUsers()).data;
      setUsers(users);
    } catch (e: any) {
      notify.error({ message: 'Failed to load users. Reload page', description: extractErrorMsg(e) });
    }
  }, [notify]);

  const groupMembers = useMemo<User[]>(() => {
    if (!groupId) return [];
    const members = users.filter((u) => Object.keys(u.user_group_ids ?? {}).includes(groupId)) || [];
    setNewGroupMembers(members);
    return members;
  }, [groupId, users]);

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
          <Form.Item
            name={rowData.network_id}
            noStyle
            // initialValue={Object.keys(group?.network_roles ?? {}).find((nw) => nw === rowData.network_id) ?? ''}
            initialValue={Object.keys(group?.network_roles?.[rowData.network_id] ?? {})?.[0] ?? ''}
          >
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
    [group?.network_roles],
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
            onClick={() => setNewGroupMembers(groupMembers.filter((m) => m.username !== rowData.username))}
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

  const updateGroup = useCallback(async () => {
    try {
      if (!group) throw new Error('Group details did not load. Refresh page');

      setIsSubmitting(true);
      const metadata = await metadataForm.validateFields();
      const networkRoles = await networkRolesForm.validateFields();

      const networkRolesPayload = Object.keys(networkRoles).reduce(
        (acc, nw) => {
          if (networkRoles[nw]) acc[nw] = { [networkRoles[nw]]: {} };
          return acc;
        },
        {} as UserGroup['network_roles'],
      );

      await UsersService.updateGroup({
        id: group.id,
        network_roles: networkRolesPayload,
        meta_data: metadata.metadata,
        platform_role: metadata.platformRole,
      });

      notification.success({ message: 'User group updated successfully' });
      navigate(resolveAppRoute(AppRoutes.USERS_ROUTE));
    } catch (e: any) {
      notify.error({ message: 'Failed to update user group', description: extractErrorMsg(e) });
    } finally {
      setIsSubmitting(false);
    }
  }, [group, metadataForm, navigate, networkRolesForm, notify]);

  useEffect(() => {
    loadDetails();
    loadNetworks();
    loadRoles();
    loadUsers();
  }, [loadNetworks, loadRoles, loadUsers, loadDetails]);

  return (
    <Layout.Content
      className="UserGroupDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active title className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding" style={{ borderBottom: `1px solid ${themeToken.colorBorder}` }}>
          <Col xs={24}>
            <Link to={resolveAppRoute(AppRoutes.USERS_ROUTE)}>View All Groups</Link>
            <Row>
              <Col xs={18} lg={12}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  User Group Details
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
                <Form.Item name="name" label="Group Name" style={{ width: '80%' }}>
                  <Typography.Text style={{ fontWeight: 'bold' }}>{group?.id ?? ''}</Typography.Text>
                </Form.Item>
              </Col>
              {/* <Col xs={24} md={12}>
                <Form.Item name="auto-assign" label="Auto-assign on startup">
                  <Switch />
                </Form.Item>
              </Col> */}
              <Col xs={24}>
                <Form.Item
                  name="metadata"
                  label="Group Description"
                  style={{ width: '80%' }}
                  initialValue={group?.meta_data ?? ''}
                >
                  <Input.TextArea placeholder="Enter a description for this new group" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="platformRole"
                  label="Platform Role"
                  initialValue={group?.platform_role ?? ''}
                  tooltip="The platform role determines the level of access the user group has to the platform, and not one network specifically."
                  rules={[{ required: true, whitespace: false }]}
                  style={{ width: '80%' }}
                >
                  <Select
                    placeholder="Select a platform role"
                    style={{ width: '100%' }}
                    options={availableUserRoles
                      .filter((r) => deriveUserRoleType(r) === 'platform-role')
                      .map((r) => ({ label: r.id, value: r.id }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Row>

        <Row className="tabbed-page-row-padding" style={{ paddingBottom: '0px' }}>
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

        <Row className="tabbed-page-row-padding" style={{ paddingBottom: '5rem', paddingTop: '0px' }}>
          <Col xs={24}>
            <Card
              size="small"
              title="Group Members"
              style={{ width: '100%', marginBottom: '2rem' }}
              extra={
                <Button size="small" onClick={() => setIsAddUserModalOpen(true)}>
                  <PlusOutlined /> Add User
                </Button>
              }
            >
              <Row style={{ padding: '.5rem 0rem' }} data-nmui-intercom="new-group_network-roles">
                <Col xs={24} style={{ paddingBottom: '1rem ' }}>
                  <Input
                    placeholder="Search for a user"
                    value={membersSearch}
                    onChange={(e) => setMembersSearch(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24}>
                  <Table
                    size="small"
                    columns={groupMembersTableCols}
                    dataSource={filteredMembers}
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
            <Button type="primary" size="large" loading={isSubmitting} onClick={updateGroup}>
              <EditOutlined /> Update Group
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
        currentGroupMembers={newGroupMembers}
        onUserSelected={(user) => {
          setNewGroupMembers([...new Set([...groupMembers, user])]);
        }}
      />
    </Layout.Content>
  );
}
