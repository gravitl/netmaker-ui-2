import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Table,
  TableColumnProps,
  Tabs,
  TabsProps,
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User, UserGroup, UserRole, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { kebabCaseToTitleCase, snakeCaseToTitleCase, useServerLicense } from '@/utils/Utils';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';
import { isSaasBuild } from '@/services/BaseService';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { useStore } from '@/store/store';

interface UserdetailsModalProps {
  isOpen: boolean;
  user: User;
  onUpdateUser: (user: User) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  addUserButtonRef?: Ref<HTMLDivElement>;
  addUserNameInputRef?: Ref<HTMLDivElement>;
  addUserPasswordInputRef?: Ref<HTMLDivElement>;
  addUserSetAsAdminCheckboxRef?: Ref<HTMLDivElement>;
}

type CreateUserForm = User & {
  password: string;
  'confirm-password': string;
  'role-assignment-type': 'by-group' | 'by-manual';
  'user-groups': UserGroup['id'][];
  networkRoles: { [network: string]: UserRoleId[] };
};

interface NetworkRolesTableData {
  network: string;
  roles: UserRole[];
}

const groupsTabKey = 'groups';
const customRolesTabKey = 'custom-roles';
const defaultTabKey = groupsTabKey;

export default function UserDetailsModal({
  isOpen,
  user,
  onUpdateUser,
  onCancel,
  addUserNameInputRef,
  addUserPasswordInputRef,
}: UserdetailsModalProps) {
  const [form] = Form.useForm<CreateUserForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const { isServerEE } = useServerLicense();
  const passwordVal = Form.useWatch('password', form);
  const [networkRoles, setNetworkRoles] = useState<UserRole[]>([]);
  const [platformRoles, setPlatformRoles] = useState<UserRole[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isEditingUserPermissions, setIsEditingUserPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTabKey);

  const palVal = Form.useWatch('platform_role_id', form);

  const networkRolesTableData = useMemo<NetworkRolesTableData[]>(() => {
    const roles = networkRoles
      .reduce(
        (acc, role) => {
          const network = role.network_id;
          const existingRole = acc.find((r) => r.network === network);
          if (existingRole) {
            existingRole.roles.push(role);
          } else {
            acc.push({ network, roles: [role] });
          }
          return acc;
        },
        [] as { network: string; roles: UserRole[] }[],
      )
      .sort((a, b) => a.network.localeCompare(b.network));

    const allNetsRoleIndex = roles.findIndex((r) => r.network === 'all_networks');
    if (allNetsRoleIndex === -1) return roles;

    const allNetsRole = roles.splice(allNetsRoleIndex, 1);
    roles.unshift(allNetsRole[0]);
    return roles;
  }, [networkRoles]);

  const networkRolesTableCols: TableColumnProps<NetworkRolesTableData>[] = useMemo(
    () => [
      {
        title: 'Network',
        dataIndex: 'network',
        width: '30%',
        render(network: string) {
          if (network === 'all_networks')
            return (
              <Tooltip title="Selected roles will apply to all networks">
                <Typography.Text strong color="primary">
                  All Networks
                </Typography.Text>
              </Tooltip>
            );
          return <Typography.Text>{network}</Typography.Text>;
        },
      },
      {
        title: 'Role',
        width: '70%',
        render(_, rowData) {
          return (
            <Form.Item
              name={['networkRoles', rowData.network]}
              initialValue={(() => {
                const ret = Object.keys(user?.network_roles?.[rowData.network] ?? {}) ?? [];
                return ret;
              })()}
              noStyle
            >
              <Select
                mode="multiple"
                placeholder="Select user roles for this network"
                allowClear
                options={rowData.roles
                  .sort((a, b) => a.id.localeCompare(b.id))
                  .map((r) => ({ value: r.id, label: r.ui_name || r.id }))}
              />
            </Form.Item>
          );
        },
      },
    ],
    [user?.network_roles],
  );

  const resetModal = () => {
    form.resetFields();
  };

  const canChangePlatformRole: (user: User) => [boolean, string] = useCallback(
    (user: User) => {
      if (store.user?.username === user.username) return [false, 'Cannot change your own platform access level'];
      // if current user is super admin, they can change PAL of any other user
      if (store.user?.platform_role_id === 'super-admin') {
        return [true, ''];
      }
      if (store.user?.platform_role_id === 'admin') {
        if (user.platform_role_id === 'super-admin') {
          return [false, 'Cannot change platform access level of the super admin'];
        }
        if (user.platform_role_id === 'admin') {
          return [false, "Cannot change another admin's platform access level"];
        }
        return [true, ''];
      }
      return [false, "Cannot change another user's platform access level"];
    },
    [store.user],
  );

  const loadGroups = useCallback(async () => {
    try {
      const groups = (await UsersService.getGroups()).data.Response;
      setGroups(groups);
    } catch (err) {
      notify.error({
        message: 'Failed to load groups',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

  const loadRoles = useCallback(async () => {
    try {
      const networkRoles = (await UsersService.getRoles()).data.Response;
      const platformRoles = (await UsersService.getRoles('platform-role')).data.Response;
      setNetworkRoles(networkRoles);
      setPlatformRoles(platformRoles.filter((r) => r.id !== 'super-admin'));
    } catch (err) {
      notify.error({
        message: 'Failed to load roles',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

  const updateUser = async () => {
    try {
      const formData = await form.validateFields();

      const payload: any = {
        ...JSON.parse(JSON.stringify(formData)),
        username: user.username,
        password: formData.password || undefined,
      };

      if (!isServerEE) payload['platform_role_id'] = 'admin';

      payload['network_roles'] = {} as User['network_roles'];
      payload['user_group_ids'] = {} as User['user_group_ids'];

      payload['user_group_ids'] = (formData['user-groups'] ?? []).reduce((acc, g) => ({ ...acc, [g]: {} }), {});
      Object.keys(formData.networkRoles ?? {}).forEach((networkId) => {
        payload.network_roles[networkId] = {};
        formData.networkRoles[networkId].forEach((roleId) => {
          payload.network_roles[networkId][roleId] = {};
        });
        // remove empty network roles
        if (Object.keys(payload.network_roles[networkId]).length === 0) {
          delete payload.network_roles[networkId];
        }
      });
      delete payload['role-assignment-type'];
      delete payload['user-groups'];
      delete payload['confirm-password'];
      delete payload['networkRoles'];

      const newUser = (await UsersService.updateUser(user.username, payload)).data;
      resetModal();
      notification.success({ message: `User ${newUser.username} updated` });
      onUpdateUser(newUser);
    } catch (err) {
      notify.error({
        message: 'Failed to update user',
        description: extractErrorMsg(err as any),
      });
    }
  };

  // ui components
  const getGroupsContent = useCallback(() => {
    return (
      <Row>
        <Col xs={24}>
          <Form.Item
            name="user-groups"
            label="Which groups will the user join"
            initialValue={Object.keys(user.user_group_ids ?? {})}
          >
            <Select
              mode="multiple"
              placeholder="Select groups"
              options={groups
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((g) => ({
                  value: g.id,
                  label: g.id,
                }))}
            />
          </Form.Item>
        </Col>
      </Row>
    );
  }, [groups, user.user_group_ids]);

  const getCustomRolesContent = useCallback(() => {
    return (
      <Row>
        <Col xs={24}>
          <Form.Item label="Select the user's roles for each network">
            <Table
              columns={networkRolesTableCols}
              dataSource={networkRolesTableData}
              rowKey="network"
              size="small"
              pagination={{ size: 'small', hideOnSinglePage: true }}
              rowClassName={(rowData) => {
                if (rowData.network === 'all_networks') return 'highlighted-row';
                return '';
              }}
            />
          </Form.Item>
        </Col>
      </Row>
    );
  }, [networkRolesTableCols, networkRolesTableData]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: groupsTabKey,
        label: 'Groups',
        children: getGroupsContent(),
      },
      {
        key: customRolesTabKey,
        label: 'Additional Roles Per Network',
        children: getCustomRolesContent(),
      },
    ],
    [getGroupsContent, getCustomRolesContent],
  );

  const getPalDesc = useCallback((pal: UserRoleId) => {
    switch (pal) {
      case 'admin':
        return <Typography.Text type="secondary">Admins can access all features and manage all users.</Typography.Text>;
      case 'platform-user':
        return (
          <Typography.Text type="secondary">
            Platform users can log into the dashboard and access the networks they are assigned to.
          </Typography.Text>
        );
      case 'service-user':
        return (
          <Typography.Text type="secondary">
            Service users cannot log into the dashboard; they use{' '}
            <Typography.Link href={ExternalLinks.RAC_DOWNLOAD_DOCS_LINK} target="_blank">
              RAC
            </Typography.Link>{' '}
            to access their assigned networks.
          </Typography.Text>
        );
      default:
        return '';
    }
  }, []);

  useEffect(() => {
    if (isServerEE && isOpen) {
      loadGroups();
      loadRoles();
    }
  }, [isOpen, isServerEE, loadGroups, loadRoles]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '60vw' }}>User Details</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
      style={{ minWidth: '60vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Form name="update-user-form" form={form} layout="vertical">
          <Row ref={addUserNameInputRef}>
            <Col xs={24}>
              <Form.Item label="Username" name="username">
                <Typography.Text>{user.username}</Typography.Text>
              </Form.Item>
            </Col>
          </Row>

          {!isSaasBuild && (
            <>
              <Row>
                <Col xs={24}>
                  <Form.Item label="User Login Type">
                    <Typography.Text>{snakeCaseToTitleCase(user.auth_type)}</Typography.Text>
                  </Form.Item>
                </Col>
              </Row>

              <Row ref={addUserPasswordInputRef}>
                <Col xs={24}>
                  <Form.Item label="Password" name="password">
                    <Input
                      placeholder="(unchanged)"
                      type="password"
                      disabled={user.auth_type === 'oauth'}
                      title={user.auth_type === 'oauth' ? 'You cannot change the password of an OAuth user' : ''}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Confirm Password"
                name="confirm-password"
                rules={[
                  {
                    validator(_, value) {
                      if (value !== passwordVal) {
                        return Promise.reject('Password must match');
                      } else {
                        return Promise.resolve();
                      }
                    },
                  },
                ]}
                dependencies={['password']}
              >
                <Input
                  placeholder="(unchanged)"
                  type="password"
                  disabled={user.auth_type === 'oauth'}
                  title={user.auth_type === 'oauth' ? 'You cannot change the password of an OAuth user' : ''}
                />
              </Form.Item>
            </>
          )}

          {isServerEE && (
            <>
              <Divider />

              <Row>
                <Col xs={24}>
                  <Form.Item
                    name="platform_role_id"
                    label="Platform Access Level"
                    tooltip="This specifies the server-wide permissions this user will have"
                    initialValue={user.platform_role_id}
                    required
                    extra={getPalDesc(palVal)}
                  >
                    <Select
                      placeholder="Select a platform access level for the user"
                      options={platformRoles.map((r) => ({
                        value: r.id,
                        label: kebabCaseToTitleCase(r.id),
                        disabled: !isServerEE && !isAdminUserOrRole(r),
                      }))}
                      disabled={!canChangePlatformRole(user)[0]}
                      title={canChangePlatformRole(user)[1]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {!!palVal && isServerEE && !isAdminUserOrRole(palVal) && (
            <Row>
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
          )}
        </Form>
      </div>

      <div className="CustomModalBody">
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <Row>
          <Col xs={24} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={updateUser}>
              Update User
            </Button>
          </Col>
        </Row>
      </div>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
