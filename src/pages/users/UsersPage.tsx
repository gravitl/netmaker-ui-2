import { useStore } from '@/store/store';
import {
  CopyOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
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
import { User, UserInvite } from '@/models/User';
import AddUserModal from '@/components/modals/add-user-modal/AddUserModal';
import UpdateUserModal from '@/components/modals/update-user-modal/UpdateUserModal';
import { isSaasBuild } from '@/services/BaseService';
import { getAmuiUrl, getUserGroupRoute, resolveAppRoute, useQuery } from '@/utils/RouteUtils';
import TransferSuperAdminRightsModal from '@/components/modals/transfer-super-admin-rights/TransferSuperAdminRightsModal';
import { copyTextToClipboard, snakeCaseToTitleCase, useBranding } from '@/utils/Utils';
import RolesPage from './RolesPage';
import GroupsPage from './GroupsPage';
import UserDetailsModal from '@/components/modals/user-details-modal/UserDetailsModal';
import InviteUserModal from '@/components/modals/invite-user-modal/InviteUserModal';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '@/routes';

const USERS_DOCS_URL = 'https://docs.netmaker.io/pro/pro-users.html';

export const UsersPageTabs = {
  usersTabKey: 'users',
  rolesTabKey: 'roles',
  groupsTabKey: 'groups',
  invitesTabKey: 'invites',
};
const defaultTabKey = UsersPageTabs.usersTabKey;

export default function UsersPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const branding = useBranding();
  const navigate = useNavigate();
  const queryParams = useQuery();

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
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [pendingUserInvitesSearch, setUserInvitesSearch] = useState('');
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

  const loadInvites = useCallback(async () => {
    try {
      setIsLoadingInvites(true);
      const invites = (await UsersService.getUserInvites()).data.Response;
      setInvites(invites);
    } catch (err) {
      notify.error({
        message: 'Failed to load user invites',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsLoadingInvites(false);
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

  const canDeleteUser: (user: User) => [boolean, string] = useCallback(
    (user: User) => {
      // cannot delete oneself
      if (store.user?.username === user.username) return [false, 'Cannot delete oneself'];
      // if current user is super admin, they can delete any other user
      if (store.user?.platform_role_id === 'super-admin') {
        return [true, ''];
      }
      if (store.user?.platform_role_id === 'admin') {
        if (user.platform_role_id === 'super-admin') {
          return [false, 'Cannot delete the super admin'];
        }
        if (user.platform_role_id === 'admin') {
          return [false, 'Cannot delete another admin'];
        }
        return [true, ''];
      }
      return [false, 'Cannot delete another user'];
    },
    [store.user],
  );

  const canChangePassword: (user: User) => [boolean, string] = useCallback(
    (user: User) => {
      if (store.user?.username === user.username) return [true, ''];
      if (user.auth_type === 'oauth') return [false, 'Cannot change password of an oauth user'];
      // if current user is super admin, they can change password of any other user
      if (store.user?.platform_role_id === 'super-admin') {
        return [true, ''];
      }
      if (store.user?.platform_role_id === 'admin') {
        if (user.platform_role_id === 'super-admin') {
          return [false, 'Cannot change password of the super admin'];
        }
        if (user.platform_role_id === 'admin') {
          return [false, "Cannot change another admin' password"];
        }
        return [true, ''];
      }
      return [false, 'Cannot change another user password'];
    },
    [store.user],
  );

  const confirmDeleteInvite = useCallback(
    async (invite: UserInvite) => {
      Modal.confirm({
        title: 'Delete invite',
        content: `Are you sure you want to delete this user invite for ${invite.email}?`,
        onOk: async () => {
          try {
            await UsersService.deleteUserInvite(invite.email);
            notify.success({ message: `Invite for ${invite.email} deleted` });
            setInvites((invites) => invites.filter((i) => i.email !== invite.email));
          } catch (err) {
            notify.error({
              message: 'Failed to delete invite',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify],
  );

  const confirmDeleteAllInvitesUsers = useCallback(async () => {
    Modal.confirm({
      title: 'Delete all user invites',
      content: `Are you sure you want to clear all pending invites?`,
      onOk: async () => {
        try {
          await UsersService.deleteAllUserInvites();
          notify.success({ message: `All user invites cleared` });
          setInvites([]);
        } catch (err) {
          notify.error({
            message: 'Failed to delete invites',
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
                if (username === store.username) {
                  navigate(resolveAppRoute(AppRoutes.PROFILE_ROUTE));
                  return;
                }
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
        title: 'Platform Access Level',
        render(_, user) {
          return <Typography.Text>{snakeCaseToTitleCase(user.platform_role_id)}</Typography.Text>;
        },
      },
      {
        title: 'Groups',
        render(_, user) {
          return Object.keys(user?.user_group_ids ?? {}).map((g, i) => (
            <>
              <Typography.Link key={g} onClick={() => navigate(getUserGroupRoute(g))}>
                {g}
              </Typography.Link>
              {i !== Object.keys(user?.user_group_ids).length - 1 ? ', ' : ''}
            </>
          ));
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
                    label: 'Change Password',
                    disabled: !canChangePassword(user)[0],
                    title: canChangePassword(user)[0] ? canChangePassword(user)[1] : '',
                    onClick: (ev: any) => {
                      ev.domEvent.stopPropagation();
                      const userClone = structuredClone(user);
                      onEditUser(userClone);
                    },
                  },
                  {
                    key: 'delete',
                    disabled: !canDeleteUser(user)[0],
                    title: canDeleteUser(user)[0] ? canDeleteUser(user)[1] : '',
                    // label: <Typography.Text disabled={!canDeleteUser(user)[0]}>Delete</Typography.Text>,
                    label: 'Delete',
                    onClick: (ev: any) => {
                      ev.domEvent.stopPropagation();
                      confirmDeleteUser(user);
                    },
                  },
                ].concat(
                  user.platform_role_id === 'super-admin' && store.username === user.username
                    ? [
                        {
                          key: 'transfer',
                          label: 'Transfer Super Admin Rights',
                          disabled: false,
                          title: '',
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
    [store.username, navigate, canChangePassword, canDeleteUser, onEditUser, confirmDeleteUser],
  );

  const userInvitesTableColumns: TableColumnsType<UserInvite> = useMemo(
    () => [
      {
        title: 'Username',
        dataIndex: 'email',
        sorter(a, b) {
          return a.email.localeCompare(b.email);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Invite Code',
        dataIndex: 'invite_code',
        render(code, rowData) {
          return (
            <Row>
              <Col>
                <Button
                  style={{ marginRight: '1rem' }}
                  type="link"
                  onClick={() => copyTextToClipboard(rowData.invite_url)}
                >
                  Copy Magic Link <CopyOutlined />
                </Button>
              </Col>
            </Row>
          );
        },
      },
      {
        width: '300px',
        render(_, invite) {
          return (
            <Row>
              {/* <Col>
                <Tooltip title="Copy invite code">
                  <Button
                    style={{ marginRight: '1rem' }}
                    type="link"
                    onClick={() => copyTextToClipboard(invite.invite_code)}
                  >
                    <CopyOutlined />
                  </Button>
                </Tooltip>
              </Col> */}
              <Col>
                <Button onClick={() => confirmDeleteInvite(invite)}>
                  <DeleteOutlined /> Delete
                </Button>
              </Col>
            </Row>
          );
        },
      },
    ],
    [confirmDeleteInvite],
  );

  const filteredUsers = useMemo(() => {
    return (
      users?.filter((u) => {
        return u.username.toLowerCase().includes(usersSearch.trim().toLowerCase());
      }) ?? []
    );
  }, [users, usersSearch]);

  const filteredUserInvites = useMemo(() => {
    return (
      invites?.filter((u) => {
        return u.email.toLowerCase().includes(pendingUserInvitesSearch.trim().toLowerCase());
      }) ?? []
    );
  }, [invites, pendingUserInvitesSearch]);

  const getUserAndUpdateInStore = async (username: User['username'] | undefined) => {
    if (!username) return;
    try {
      const user: User = await (await UsersService.getUser(username)).data.Response;
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
                size="small"
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
  }, [usersSearch, onAddUser, onInviteUser, usersTableColumns, filteredUsers, isLoadingUsers, loadUsers]);

  const getInvitesContent = useCallback(() => {
    return (
      <>
        <Row>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Search user invites"
              prefix={<SearchOutlined />}
              value={pendingUserInvitesSearch}
              onChange={(ev) => setUserInvitesSearch(ev.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={16} style={{ textAlign: 'right' }} className="pending-user-table-button">
            <Button
              title="Go to Users documentation"
              size="large"
              href={USERS_DOCS_URL}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
            {/* <Button
              size="large"
              onClick={() => {
                setIsTourOpen(true);
                setTourStep(5);
              }}
              style={{ marginRight: '0.5em' }}
            >
              <InfoCircleOutlined /> Start Tour
            </Button> */}
            <Button size="large" onClick={() => loadInvites()} style={{ marginRight: '0.5em' }}>
              <ReloadOutlined /> Reload invites
            </Button>
            <Button
              size="large"
              onClick={confirmDeleteAllInvitesUsers}
              ref={denyAllUsersButtonRef}
              style={{ marginRight: '0.5em' }}
            >
              <DeleteOutlined /> Clear All Invites
            </Button>
            <Button type="primary" size="large" onClick={onInviteUser} style={{ marginRight: '0.5em' }}>
              <PlusOutlined /> Invite User(s)
            </Button>
          </Col>
        </Row>
        <Row className="" style={{ marginTop: '1rem' }}>
          <Col xs={24}>
            <div className="table-wrapper">
              <Table
                loading={isLoadingInvites}
                columns={userInvitesTableColumns}
                dataSource={filteredUserInvites}
                rowKey="username"
                size="small"
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
    confirmDeleteAllInvitesUsers,
    filteredUserInvites,
    isLoadingInvites,
    loadInvites,
    onInviteUser,
    pendingUserInvitesSearch,
    userInvitesTableColumns,
  ]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: UsersPageTabs.usersTabKey,
        label: 'Users',
        children: getUsersContent(),
      },
      {
        key: UsersPageTabs.rolesTabKey,
        label: 'Network Roles',
        children: <RolesPage />,
      },
      {
        key: UsersPageTabs.groupsTabKey,
        label: 'Groups',
        children: <GroupsPage users={users} />,
      },
      {
        key: UsersPageTabs.invitesTabKey,
        label: `Invites (${invites.length})`,
        children: getInvitesContent(),
      },
    ],
    [getInvitesContent, getUsersContent, invites.length, users],
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
        setActiveTab(UsersPageTabs.usersTabKey);
        break;
      case 5:
        setIsAddUserModalOpen(false);
        setActiveTab(UsersPageTabs.invitesTabKey);
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
    loadInvites();

    queryParams.get('tab') && setActiveTab(queryParams.get('tab') as string);
  }, [loadUsers, isServerEE, loadInvites]);

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
          key={`user-detail-${selectedUser.username}`}
          user={selectedUser}
          onUpdateUser={(newUser) => {
            setUsers(users.map((u) => (u.username === newUser.username ? newUser : u)));
            setIsUserDetailsModalOpen(false);
            setSelectedUser(null);
          }}
          onCancel={() => {
            setIsUserDetailsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
      {selectedUser && (
        <UpdateUserModal
          isOpen={isUpdateUserModalOpen}
          key={`user-update-${selectedUser.username}`}
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
        onCancel={() => {
          setIsInviteModalOpen(false);
        }}
        onInviteFinish={() => {
          loadInvites();
          setIsInviteModalOpen(false);
        }}
      />
    </Layout.Content>
  );
}
