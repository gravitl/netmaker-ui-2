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
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { User } from '@/models/User';
import AddUserModal from '@/components/modals/add-user-modal/AddUserModal';
import UpdateUserModal from '@/components/modals/update-user-modal/UpdateUserModal';
import { isSaasBuild } from '@/services/BaseService';
import { getAmuiUrl } from '@/utils/RouteUtils';
import TransferSuperAdminRightsModal from '@/components/modals/transfer-super-admin-rights/TransferSuperAdminRightsModal';
import { useBranding } from '@/utils/Utils';

export default function UsersPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const branding = useBranding();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersSearch, setUsersSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);
  const [isTransferSuperAdminRightsModalOpen, setIsTransferSuperAdminRightsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    [notify],
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

  const getUserTagColor = (user: User) => {
    if (user.issuperadmin) {
      return 'success';
    } else if (user.isadmin) {
      return 'warning';
    } else {
      return 'default';
    }
  };

  const getUserTagText = (user: User) => {
    if (user.issuperadmin) {
      return 'Super Admin';
    } else if (user.isadmin) {
      return 'Admin';
    } else {
      return 'User';
    }
  };

  const checkIfCurrentUserCanEditOrDeleteUsers = useCallback(
    (user: User) => {
      // if current user is super admin, he can edit or delete any user
      if (store.user?.issuperadmin) {
        return false;
      }

      if (store.user?.isadmin) {
        // if current user is admin and he is editing his own profile, he can edit/delete his own profile
        if (user.username === store.username) {
          return false;
        }

        // if current user is admin, he can edit or delete any user except super admin and he can't edit/delete other admin users
        if (user.issuperadmin || user.isadmin) {
          return true;
        }
        return false;
      }

      // if current user is not admin or super admin, he can't edit or delete any user
      return true;
    },
    [store.user, store.username],
  );

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
          return <Tag color={getUserTagColor(user)}>{getUserTagText(user)}</Tag>;
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
                    disabled: checkIfCurrentUserCanEditOrDeleteUsers(user),
                    title: checkIfCurrentUserCanEditOrDeleteUsers(user) ? 'You cannot edit another admin user' : null,
                    onClick: (ev: any) => {
                      ev.domEvent.stopPropagation();
                      const userClone = structuredClone(user);
                      onEditUser(userClone);
                    },
                  },
                  {
                    key: 'default',
                    disabled: checkIfCurrentUserCanEditOrDeleteUsers(user),
                    title: checkIfCurrentUserCanEditOrDeleteUsers(user)
                      ? 'You cannot delete another admin user or the super admin'
                      : null,
                    label: (
                      <Typography.Text
                        disabled={checkIfCurrentUserCanEditOrDeleteUsers(user)}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          confirmDeleteUser(user);
                        }}
                      >
                        Delete
                      </Typography.Text>
                    ),
                  },
                ].concat(
                  isServerEE && user.issuperadmin && store.username === user.username
                    ? [
                        {
                          key: 'transfer',
                          label: 'Transfer Super Admin Rights',
                          disabled: false,
                          title: null,
                          onClick: (ev) => {
                            ev.domEvent.stopPropagation();
                            setIsTransferSuperAdminRightsModalOpen(true);
                          },
                        },
                      ]
                    : [],
                ) as MenuProps['items'],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [checkIfCurrentUserCanEditOrDeleteUsers, isServerEE, store.username, onEditUser, confirmDeleteUser],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      return u.username.toLowerCase().includes(usersSearch.trim().toLowerCase());
    });
  }, [users, usersSearch]);

  const getUserAndUpdateInStore = async (username: User['username'] | undefined) => {
    if (!username) return;
    try {
      const user = await (await UsersService.getUser(username)).data;
      store.setStore({ user });
    } catch (err) {
      notify.error({ message: 'Failed to get user details', description: extractErrorMsg(err as any) });
    }
  };

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
    [getUsersContent],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers, isServerEE]);

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
                  {branding.productName} allows you to perform Identity and Access Management (IAM) with users. You can
                  create multiple profiles and restrict access to networks.
                </Typography.Text>
              </Col>
              <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a User</Typography.Title>
                  <Typography.Text>
                    Users access the {branding.productName} UI to configure their networks.
                  </Typography.Text>
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
                    Manage access to {branding.productName}
                  </Typography.Title>
                  <Typography.Text>
                    {branding.productName} allows you to perform Identity and Access Management (IAM) with users. You
                    can create multiple profiles and restrict access to networks.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    User Groups
                  </Typography.Title>
                  <Typography.Text>
                    Easily manage access to a {branding.productName} resources by creating user groups. You can create
                    multiple groups and assign users to them, then control access to the groups. This is a{' '}
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
                    OAuth users on {branding.productName}
                  </Typography.Title>
                  <Typography.Text>
                    {branding.productName} supports OAuth (Social Sign-On) for user authentication. You can configure
                    your OAuth provider to allow users to login to {branding.productName}.
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
      <TransferSuperAdminRightsModal
        isOpen={isTransferSuperAdminRightsModalOpen}
        onCancel={() => setIsTransferSuperAdminRightsModalOpen(false)}
        onTransferSuccessful={() => {
          // refresh user list and refresh current user
          getUserAndUpdateInStore(store.username);
          loadUsers();
        }}
      />
    </Layout.Content>
  );
}
