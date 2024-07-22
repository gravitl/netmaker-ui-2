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
import { getAmuiUrl } from '@/utils/RouteUtils';
import TransferSuperAdminRightsModal from '@/components/modals/transfer-super-admin-rights/TransferSuperAdminRightsModal';
import { useBranding } from '@/utils/Utils';
import RolesPage from './RolesPage';
import GroupsPage from './GroupsPage';
import UserDetailsModal from '@/components/modals/user-details-modal/UserDetailsModal';
import { mockNewUserWithGroup, mockNewUserWithoutGroup } from '@/constants/Types';
import InviteUserModal from '@/components/modals/invite-user-modal/InviteUserModal';

const USERS_DOCS_URL = 'https://docs.netmaker.io/pro/pro-users.html';

const usersTabKey = 'users';
const rolesTabKey = 'roles';
const groupsTabKey = 'groups';
const pendingUsersTabKey = 'pending-users';
const defaultTabKey = usersTabKey;

export default function UsersPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const branding = useBranding();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersSearch, setUsersSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);
  const [isTransferSuperAdminRightsModalOpen, setIsTransferSuperAdminRightsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoadingPendingUsers, setIsLoadingPendingUsers] = useState(true);
  const [pendingUsersSearch, setPendingUsersSearch] = useState('');
  const [activeTab, setActiveTab] = useState(defaultTabKey);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const usersTableRef = useRef(null);
  const addUserButtonRef = useRef(null);
  const addUserNameInputRef = useRef(null);
  const addUserPasswordInputRef = useRef(null);
  const addUserSetAsAdminCheckboxRef = useRef(null);
  const denyAllUsersButtonRef = useRef(null);
  const pendingUsersTableRef = useRef(null);

  const loadUsers = useCallback(
    async (showLoading = true) => {
      try {
        showLoading && setIsLoadingUsers(true);
        const users = (await UsersService.getUsers()).data;
        setUsers(users);
      } catch (err) {
        notify.error({
          message: 'Failed to load users',
          description: extractErrorMsg(err as any),
        });
      } finally {
        showLoading && setIsLoadingUsers(false);
      }
    },
    [notify],
  );

  const loadPendingUsers = useCallback(async () => {
    try {
      setIsLoadingPendingUsers(true);
      const users = (await UsersService.getPendingUsers()).data;
      setPendingUsers(users);
    } catch (err) {
      notify.error({
        message: 'Failed to load pending users',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsLoadingPendingUsers(false);
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

  const onInviteUser = useCallback(() => {
    if (isSaasBuild) {
      window.location = getAmuiUrl('invite-user') as any;
      return;
    } else {
      setIsInviteModalOpen(true);
    }
  }, []);

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

  const confirmApproveUser = useCallback(
    async (user: User) => {
      Modal.confirm({
        title: 'Approve user',
        content: `Are you sure you want to approve pending user ${user.username}?`,
        onOk: async () => {
          try {
            await UsersService.approvePendingUser(user.username);
            notify.success({ message: `User ${user.username} approved` });
            setPendingUsers((users) => users.filter((u) => u.username !== user.username));
            loadUsers(false);
          } catch (err) {
            notify.error({
              message: 'Failed to approve user',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [loadUsers, notify],
  );

  const confirmDenyUser = useCallback(
    async (user: User) => {
      Modal.confirm({
        title: 'Deny user',
        content: `Are you sure you want to deny pending user ${user.username}?`,
        onOk: async () => {
          try {
            await UsersService.denyPendingUser(user.username);
            notify.success({ message: `User ${user.username} denied` });
            setPendingUsers((users) => users.filter((u) => u.username !== user.username));
          } catch (err) {
            notify.error({
              message: 'Failed to deny user',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify],
  );

  const confirmDenyAllPendingUsers = useCallback(async () => {
    Modal.confirm({
      title: 'Deny all panding users',
      content: `Are you sure you want to deny all pending users?`,
      onOk: async () => {
        try {
          await UsersService.denyAllPendingUsers();
          notify.success({ message: `All pending users denied access` });
          setPendingUsers([]);
        } catch (err) {
          notify.error({
            message: 'Failed to deny users',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [notify]);

  const usersTableColumns: TableColumnsType<User> = useMemo(
    () => [
      {
        title: 'Username',
        dataIndex: 'username',
        render(username: string, user) {
          return (
            <Typography.Link
              onClick={() => {
                setSelectedUser(user);
                setIsUserDetailsModalOpen(true);
              }}
            >
              {username}
            </Typography.Link>
          );
        },
        sorter(a, b) {
          return a.username.localeCompare(b.username);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Platform Role',
        render(_, user) {
          return 'user.platform_role';
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
                      <Typography.Text disabled={checkIfCurrentUserCanEditOrDeleteUsers(user)}>Delete</Typography.Text>
                    ),
                    onClick: (ev: any) => {
                      ev.domEvent.stopPropagation();
                      confirmDeleteUser(user);
                    },
                  },
                ].concat(
                  user.issuperadmin && store.username === user.username
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
    [checkIfCurrentUserCanEditOrDeleteUsers, store.username, onEditUser, confirmDeleteUser],
  );

  const pendingUsersTableColumns: TableColumnsType<User> = useMemo(
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
        width: '300px',
        render(_, user) {
          return (
            <Row>
              <Col>
                <Button style={{ marginRight: '1rem' }} onClick={() => confirmApproveUser(user)}>
                  <CheckOutlined /> Approve
                </Button>
              </Col>
              <Col>
                <Button onClick={() => confirmDenyUser(user)}>
                  <StopOutlined /> Deny
                </Button>
              </Col>
            </Row>
          );
        },
      },
    ],
    [confirmApproveUser, confirmDenyUser],
  );

  const filteredUsers = useMemo(() => {
    return (
      users?.filter((u) => {
        return u.username.toLowerCase().includes(usersSearch.trim().toLowerCase());
      }) ?? []
    );
  }, [users, usersSearch]);

  const filteredPendingUsers = useMemo(() => {
    return (
      pendingUsers?.filter((u) => {
        return u.username.toLowerCase().includes(pendingUsersSearch.trim().toLowerCase());
      }) ?? []
    );
  }, [pendingUsers, pendingUsersSearch]);

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
              allowClear
            />
          </Col>
          <Col xs={24} md={16} style={{ textAlign: 'right' }} className="user-table-button">
            <Button
              title="Go to Users documentation"
              size="large"
              href={USERS_DOCS_URL}
              target="_blank"
              icon={<QuestionCircleOutlined />}
              style={{ marginRight: '0.5rem' }}
            />
            <Button
              size="large"
              onClick={() => {
                setIsTourOpen(true);
                setTourStep(0);
              }}
              style={{ marginRight: '0.5rem' }}
            >
              <InfoCircleOutlined /> Start Tour
            </Button>
            <Button size="large" onClick={() => loadUsers()} style={{ marginRight: '0.5rem' }}>
              <ReloadOutlined /> Reload users
            </Button>
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'add',
                    label: 'Add a User',
                    onClick: onAddUser,
                  },
                  {
                    key: 'invite',
                    label: 'Invite a User',
                    onClick: onInviteUser,
                  },
                ],
              }}
            >
              <Button size="large" type="primary" style={{ display: 'inline', marginRight: '0.5rem' }}>
                <PlusOutlined /> Add a User
              </Button>
            </Dropdown>
          </Col>
        </Row>
        <Row className="" style={{ marginTop: '1rem' }}>
          <Col xs={24}>
            <div className="table-wrapper">
              <Table
                columns={usersTableColumns}
                dataSource={filteredUsers}
                rowKey="username"
                scroll={{
                  x: true,
                }}
                ref={usersTableRef}
                loading={isLoadingUsers}
              />
            </div>
          </Col>
        </Row>
      </>
    );
  }, [usersSearch, onAddUser, usersTableColumns, filteredUsers, isLoadingUsers, loadUsers]);

  const getPendingUsersContent = useCallback(() => {
    return (
      <>
        <Row>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Search pending users"
              prefix={<SearchOutlined />}
              value={pendingUsersSearch}
              onChange={(ev) => setPendingUsersSearch(ev.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={16} style={{ textAlign: 'right' }} className="pending-user-table-button">
            <Button
              size="large"
              onClick={() => {
                setIsTourOpen(true);
                setTourStep(5);
              }}
              style={{ marginRight: '0.5em' }}
            >
              <InfoCircleOutlined /> Start Tour
            </Button>
            <Button size="large" onClick={() => loadPendingUsers()} style={{ marginRight: '0.5em' }}>
              <ReloadOutlined /> Reload users
            </Button>
            <Button type="primary" size="large" onClick={confirmDenyAllPendingUsers} ref={denyAllUsersButtonRef}>
              <StopOutlined /> Deny all users
            </Button>
            <Button
              title="Go to Users documentation"
              style={{ marginLeft: '0.5rem' }}
              href={USERS_DOCS_URL}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
          </Col>
        </Row>
        <Row className="" style={{ marginTop: '1rem' }}>
          <Col xs={24}>
            <div className="table-wrapper">
              <Table
                loading={isLoadingPendingUsers}
                columns={pendingUsersTableColumns}
                dataSource={filteredPendingUsers}
                rowKey="username"
                scroll={{
                  x: true,
                }}
                ref={pendingUsersTableRef}
              />
            </div>
          </Col>
        </Row>
      </>
    );
  }, [
    confirmDenyAllPendingUsers,
    filteredPendingUsers,
    isLoadingPendingUsers,
    loadPendingUsers,
    pendingUsersSearch,
    pendingUsersTableColumns,
  ]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: usersTabKey,
        label: 'Users',
        children: getUsersContent(),
      },
      {
        key: rolesTabKey,
        label: 'Roles',
        children: <RolesPage />,
      },
      {
        key: groupsTabKey,
        label: 'Groups',
        children: <GroupsPage />,
      },
      {
        key: pendingUsersTabKey,
        label: `Pending Users (${pendingUsers.length})`,
        children: getPendingUsersContent(),
      },
    ],
    [getPendingUsersContent, getUsersContent, pendingUsers.length],
  );

  const userTourSteps: TourProps['steps'] = [
    {
      title: 'Users',
      description: 'View users and their roles, you can also edit or delete users and transfer super admin rights',
      target: () => usersTableRef.current,
      placement: 'bottom',
    },
    {
      title: 'Add a User',
      description: 'Click here to add a user',
      target: () => addUserButtonRef.current,
      placement: 'bottom',
    },
    {
      title: 'Username',
      description: 'Enter a username for the user',
      target: () => addUserNameInputRef.current,
      placement: 'bottom',
    },
    {
      title: 'Password',
      description: 'Enter a password for the user',
      target: () => addUserPasswordInputRef.current,
      placement: 'bottom',
    },
    {
      title: 'Set as Admin',
      description: 'Check this box to set the user as admin',
      target: () => addUserSetAsAdminCheckboxRef.current,
      placement: 'bottom',
    },
    {
      title: 'Review pending users',
      description:
        'An admin can allow or deny access to accounts that try accessing the server via SSO from this table.',
      target: () => pendingUsersTableRef.current,
      placement: 'bottom',
    },
    {
      title: 'Deny all pending users',
      description: 'A quick way to deny access to all pending users.',
      target: () => denyAllUsersButtonRef.current,
      placement: 'bottom',
    },
  ];

  const handleTourOnChange = (current: number) => {
    switch (current) {
      case 1:
        setIsAddUserModalOpen(false);
        break;
      case 2:
        setIsAddUserModalOpen(true);
        break;
      case 4:
        setIsAddUserModalOpen(true);
        setActiveTab(usersTabKey);
        break;
      case 5:
        setIsAddUserModalOpen(false);
        setActiveTab(pendingUsersTabKey);
        break;
      default:
        break;
    }
    setTimeout(() => {
      setTourStep(current);
    }, 200);
  };

  useEffect(() => {
    loadUsers();
    loadPendingUsers();
  }, [loadUsers, isServerEE, loadPendingUsers]);

  return (
    <Layout.Content
      className="UsersPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoadingUsers} active title={true} className="page-padding">
        {users.length === 0 && (
          <>
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <Col xs={24} xl={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  User Management
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  {branding.productName} allows you to perform Identity and Access Management (IAM) with users, roles
                  and groups. You can create multiple users, assign them roles and groups to restrict access to
                  networks, devices and other resources.
                </Typography.Text>
              </Col>
              <Col xs={24} xl={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a User</Typography.Title>
                  <Typography.Text>Users can access the this dashboard to configure their networks.</Typography.Text>
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

            <Row className="card-con" gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Add a User</Typography.Title>
              </Col>

              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Manage access to {branding.productName}
                  </Typography.Title>
                  <Typography.Text>
                    {branding.productName} allows you to perform Identity and Access Management (IAM) with users, roles
                    and groups. You can create multiple profiles and restrict access to networks.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    User Groups and Roles
                  </Typography.Title>
                  <Typography.Text>
                    Easily manage access to a {branding.productName} resources by creating user groups and roles. You
                    can create multiple groups and assign users to them, then control access to the groups. This is a{' '}
                    <a href={getAmuiUrl('upgrade')} referrerPolicy="no-referrer">
                      Pro
                    </a>{' '}
                    feature
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} xl={7}>
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
                <Typography.Title level={3}>User Management</Typography.Title>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24}>
                <Tabs
                  defaultActiveKey={defaultTabKey}
                  items={tabs}
                  activeKey={activeTab}
                  onChange={(tabKey: string) => {
                    setActiveTab(tabKey);
                  }}
                />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      <Tour
        steps={userTourSteps}
        open={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onChange={handleTourOnChange}
        current={tourStep}
      />

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
        addUserButtonRef={addUserButtonRef}
        addUserNameInputRef={addUserNameInputRef}
        addUserPasswordInputRef={addUserPasswordInputRef}
        addUserSetAsAdminCheckboxRef={addUserSetAsAdminCheckboxRef}
      />
      {selectedUser && (
        <UserDetailsModal
          isOpen={isUserDetailsModalOpen}
          key={selectedUser.username}
          user={mockNewUserWithoutGroup}
          onUpdateUser={() => {
            // loadUsers();
            // setUsers(users.map((u) => (u.username === newUser.username ? newUser : u)));
            // setIsUpdateUserModalOpen(false);
          }}
          onCancel={() => {
            // setIsUpdateUserModalOpen(false);
            // setSelectedUser(null);
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
      <TransferSuperAdminRightsModal
        isOpen={isTransferSuperAdminRightsModalOpen}
        onCancel={() => setIsTransferSuperAdminRightsModalOpen(false)}
        onTransferSuccessful={() => {
          // refresh user list and refresh current user
          getUserAndUpdateInStore(store.username);
          loadUsers();
        }}
      />
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onCancel={() => {}}
        onInviteFinish={() => {}}
      />
    </Layout.Content>
  );
}
