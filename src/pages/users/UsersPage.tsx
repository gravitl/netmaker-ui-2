import { useStore } from '@/store/store';
import { MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Layout,
  MenuProps,
  Modal,
  notification,
  Row,
  Skeleton,
  Table,
  TableColumnsType,
  Tabs,
  TabsProps,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageProps } from '../../models/Page';
import './UsersPage.scss';
import { Network } from '@/models/Network';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { User } from '@/models/User';
import { UserGroup } from '@/models/UserGroup';
import AddUserModal from '@/components/modals/add-user-modal/AddUserModal';
import AddUserGroupModal from '@/components/modals/add-user-group-modal/AddUserGroupModal';
import UpdateUserGroupModal from '@/components/modals/update-user-group-modal/UpdateUserGroupModal';
import UpdateUserModal from '@/components/modals/update-user-modal/UpdateUserModal';
import NetworkPermissionsModal from '@/components/modals/network-permissions-modal/NetworkPermissionsModal';
import { isSaasBuild } from '@/services/BaseService';
import { getAmuiUrl } from '@/utils/RouteUtils';

export default function UsersPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersSearch, setUsersSearch] = useState('');
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [isUpdateGroupModalOpen, setIsUpdateGroupModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNetworkPermissionsModalOpen, setIsNetworkPermissionsModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const users = (await UsersService.getUsers()).data;
      setUsers(users);
    } catch (err) {
      notify.error({
        message: 'Failed to load users',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  const loadUserGroups = useCallback(async () => {
    try {
      const groups = await UsersService.getUserGroups();
      setUserGroups(groups);
    } catch (err) {
      notify.error({
        message: 'Failed to load user groups',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

  const confirmDeleteUser = useCallback(
    async (user: User) => {
      Modal.confirm({
        title: 'Delete user',
        content: `Are you sure you want to delete user ${user.username}?`,
        onOk: async () => {
          try {
            await UsersService.deleteUser(user.username);
            notify.success({ message: `User ${user.username} deleted` });
            setUsers((users) => users.filter((u) => u.username !== user.username));
          } catch (err) {
            notify.error({
              message: 'Failed to delete user',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify]
  );

  const onEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setIsUpdateUserModalOpen(true);
  }, []);

  const onAddUser = useCallback(() => {
    if (isSaasBuild) {
      window.location = getAmuiUrl('invite-user') as any;
      return;
    } else {
      setIsAddUserModalOpen(true);
    }
  }, []);

  const usersTableColumns: TableColumnsType<User> = useMemo(
    () => [
      {
        title: 'Username',
        dataIndex: 'username',
        sorter(a, b) {
          return a.username.localeCompare(b.username);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Role',
        render(_, user) {
          return <Tag color={user.isadmin ? 'warning' : 'default'}>{user.isadmin ? 'Admin' : 'User'}</Tag>;
        },
      },
      {
        width: '1rem',
        render(_, user) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: 'Edit',
                    disabled: !(!user.isadmin || (user.isadmin && user.username === store.username)),
                    title: !(!user.isadmin || (user.isadmin && user.username === store.username))
                      ? 'You cannot edit another admin user'
                      : null,
                    onClick: (ev) => {
                      ev.domEvent.stopPropagation();
                      const userClone = structuredClone(user);
                      userClone.networks ??= [];
                      onEditUser(userClone);
                    },
                  },
                  {
                    key: 'default',
                    label: (
                      <Typography.Text
                        onClick={(ev) => {
                          ev.stopPropagation();
                          confirmDeleteUser(user);
                        }}
                      >
                        Delete
                      </Typography.Text>
                    ),
                  },
                ] as MenuProps['items'],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [confirmDeleteUser, onEditUser, store.username]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      return u.username.toLowerCase().includes(usersSearch.trim().toLowerCase());
    });
  }, [users, usersSearch]);

  // ui components
  const getUsersContent = useCallback(() => {
    return (
      <>
        <Row>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Search users"
              prefix={<SearchOutlined />}
              value={usersSearch}
              onChange={(ev) => setUsersSearch(ev.target.value)}
            />
          </Col>
          <Col xs={24} md={16} style={{ textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={onAddUser}>
              <PlusOutlined /> Add a User
            </Button>
          </Col>
        </Row>
        <Row className="" style={{ marginTop: '1rem' }}>
          <Col xs={24}>
            <Table columns={usersTableColumns} dataSource={filteredUsers} rowKey="username" />
          </Col>
        </Row>
      </>
    );
  }, [filteredUsers, usersSearch, usersTableColumns, onAddUser]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'users',
        label: 'Users',
        children: getUsersContent(),
      },
    ],
    [getUsersContent]
  );

  useEffect(() => {
    loadUsers();
    if (isServerEE) {
      loadUserGroups();
    }
  }, [loadUsers, loadUserGroups, isServerEE]);

  return (
    <Layout.Content
      className="UsersPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active title={true} className="page-padding">
        {users.length === 0 && (
          <>
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <Col xs={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  Users
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  Netmaker allows you to perform Identity and Access Management (IAM) with users. You can create
                  multiple profiles and restrict access to networks.
                </Typography.Text>
              </Col>
              <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a User</Typography.Title>
                  <Typography.Text>Users access the Netmaker UI to configure their networks.</Typography.Text>
                  <Row style={{ marginTop: 'auto' }}>
                    <Col>
                      <Button type="primary" size="large" onClick={onAddUser}>
                        <PlusOutlined /> Create a User
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: '8rem', padding: '0px 5.125rem' }} gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Add a User</Typography.Title>
              </Col>

              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Manage access to Netmaker
                  </Typography.Title>
                  <Typography.Text>
                    Netmaker allows you to perform Identity and Access Management (IAM) with users. You can create
                    multiple profiles and restrict access to networks.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    User Groups
                  </Typography.Title>
                  <Typography.Text>
                    Easily manage access to a Netmaker resources by creating user groups. You can create multiple groups
                    and assign users to them, then control access to the groups. This is a{' '}
                    <a href={getAmuiUrl('upgrade')} referrerPolicy="no-referrer">
                      Pro
                    </a>{' '}
                    feature
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    OAuth users on Netmaker
                  </Typography.Title>
                  <Typography.Text>
                    Netmaker supports OAuth (Social Sign-On) for user authentication. You can configure your OAuth
                    provider to allow users to login to Netmaker.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
        {users.length > 0 && (
          <>
            <Row className="page-row-padding">
              <Col xs={24}>
                <Typography.Title level={3}>Users</Typography.Title>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24}>
                <Tabs defaultActiveKey="users" items={tabs} />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* misc */}
      {notifyCtx}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onCreateUser={(user) => {
          setUsers([...users, user]);
          setIsAddUserModalOpen(false);
        }}
        onCancel={() => {
          setIsAddUserModalOpen(false);
        }}
      />
      <AddUserGroupModal
        isOpen={isAddGroupModalOpen}
        onCreateUserGroup={() => {
          loadUserGroups();
          loadUsers();
          setIsAddGroupModalOpen(false);
        }}
        onCancel={() => {
          setIsAddGroupModalOpen(false);
        }}
      />
      {selectedGroup && (
        <UpdateUserGroupModal
          isOpen={isUpdateGroupModalOpen}
          key={selectedGroup}
          group={selectedGroup}
          onUpdateUserGroup={() => {
            loadUserGroups();
            loadUsers();
            setIsUpdateGroupModalOpen(false);
          }}
          onCancel={() => {
            setIsUpdateGroupModalOpen(false);
            setSelectedGroup(null);
          }}
        />
      )}
      {selectedUser && (
        <UpdateUserModal
          isOpen={isUpdateUserModalOpen}
          key={selectedUser.username}
          user={selectedUser}
          onUpdateUser={(newUser) => {
            // loadUsers();
            setUsers(users.map((u) => (u.username === newUser.username ? newUser : u)));
            setIsUpdateUserModalOpen(false);
          }}
          onCancel={() => {
            setIsUpdateUserModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
      {selectedNetwork && (
        <NetworkPermissionsModal
          key={selectedNetwork.netid}
          isOpen={isNetworkPermissionsModalOpen}
          network={selectedNetwork}
          onUpdate={() => {
            loadUsers();
          }}
          onCancel={() => {
            setIsNetworkPermissionsModalOpen(false);
            setSelectedNetwork(null);
          }}
        />
      )}
    </Layout.Content>
  );
}
