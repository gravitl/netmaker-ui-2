import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Table,
  TableColumnProps,
  theme,
  Typography,
} from 'antd';
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User, UserGroup, UserRole, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { EditOutlined } from '@ant-design/icons';

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

interface NetworkRolePair {
  network: string;
  role: UserRoleId;
}

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
  const { token: themeToken } = theme.useToken();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const passwordVal = Form.useWatch('password', form);
  const [networkRoles, setNetworkRoles] = useState<UserRole[]>([]);
  const [platformRoles, setPlatformRoles] = useState<UserRole[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isEditingUserPermissions, setIsEditingUserPermissions] = useState(false);

  const roleAssignmentTypeVal = Form.useWatch('role-assignment-type', form);

  const networkRolesTableData = useMemo<NetworkRolesTableData[]>(() => {
    return networkRoles.reduce(
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
    );
  }, [networkRoles]);

  // const platformRoleIdVal = Form.useWatch('platform_role_id', form);

  const networkRolesTableCols: TableColumnProps<NetworkRolesTableData>[] = useMemo(
    () => [
      {
        title: 'Network',
        dataIndex: 'network',
        width: '30%',
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
                options={rowData.roles.map((r) => ({ value: r.id, label: r.id }))}
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
      setPlatformRoles(platformRoles);
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
      // set issuperadmin as false
      formData.issuperadmin = false;

      const payload: any = {
        ...JSON.parse(JSON.stringify(formData)),
        username: user.username,
        password: formData.password || undefined,
      };

      payload['network_roles'] = {} as User['network_roles'];
      payload['network_roles'] = {} as User['user_group_ids'];
      switch (formData['role-assignment-type']) {
        case 'by-group':
          payload['user_group_ids'] = formData['user-groups'].reduce((acc, g) => ({ ...acc, [g]: {} }), {});
          payload['network_roles'] = {};
          break;
        case 'by-manual':
          payload['user_group_ids'] = {};

          payload['network_roles'] = {} as User['network_roles'];
          Object.keys(formData.networkRoles).forEach((networkId) => {
            payload.network_roles[networkId] = {};
            formData.networkRoles[networkId].forEach((roleId) => {
              payload.network_roles[networkId][roleId] = {};
            });
            // remove empty network roles
            if (Object.keys(payload.network_roles[networkId]).length === 0) {
              delete payload.network_roles[networkId];
            }
          });
          break;
      }
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

  const isUserInGroup = Object.keys(user?.user_group_ids ?? {}).length > 0;

  // useEffect(() => {
  //   form.setFieldValue('user-groups', []);
  // }, [platformRoleIdVal]);

  useEffect(() => {
    loadGroups();
    loadRoles();
  }, [loadGroups, loadRoles]);

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

          <Row ref={addUserPasswordInputRef}>
            <Col xs={24}>
              <Form.Item label="Password" name="password">
                <Input placeholder="(unchanged)" type="password" />
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
            <Input placeholder="(unchanged)" type="password" />
          </Form.Item>

          <Divider />

          <Row>
            <Col xs={24}>
              <Form.Item
                name="platform_role_id"
                label="Platform Access Level"
                tooltip="This specifies the tenant-wide permissions this user will have"
                initialValue={user.platform_role_id}
                required
              >
                <Select
                  placeholder="Select a platform access level for the user"
                  options={platformRoles.map((r) => ({ value: r.id, label: r.id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {isEditingUserPermissions && (
            <>
              <Row>
                <Col xs={24}>
                  <Form.Item
                    required
                    name="role-assignment-type"
                    label="User permission model"
                    initialValue={isUserInGroup ? 'by-group' : 'by-manual'}
                  >
                    <Radio.Group>
                      <Radio value="by-group">Assign user to a group (user will inherit the group permissions)</Radio>
                      <Radio value="by-manual">Manually set user roles per network</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              {roleAssignmentTypeVal === 'by-group' && (
                <Row>
                  <Col xs={24}>
                    <Form.Item
                      name="user-groups"
                      label="User groups"
                      required
                      initialValue={Object.keys(user.user_group_ids ?? {})}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Select groups"
                        options={groups.map((g) => ({
                          value: g.id,
                          label: g.id,
                          // disabled: !!platformRoleIdVal && g.platform_role !== platformRoleIdVal,
                          // title:
                          //   platformRoleIdVal && g.platform_role !== platformRoleIdVal
                          //     ? 'Disabled because the selected platform access level conflicts with this group'
                          //     : '',
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {roleAssignmentTypeVal === 'by-manual' && (
                <Row>
                  <Col xs={24}>
                    <Form.Item label="Select the user's roles for each network">
                      <Table
                        size="small"
                        columns={networkRolesTableCols}
                        dataSource={networkRolesTableData}
                        rowKey="network"
                        pagination={{ pageSize: 15, hideOnSinglePage: true }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </>
          )}
          {!isEditingUserPermissions && (
            <>
              <Row>
                <Col xs={24} style={{ paddingBottom: '1rem' }}>
                  <Typography.Text strong>User Permission Model</Typography.Text>
                  {isUserInGroup && (
                    <Button type="link" onClick={() => setIsEditingUserPermissions(true)}>
                      Change <EditOutlined />
                    </Button>
                  )}
                </Col>
                <Col xs={24}>
                  {isUserInGroup ? (
                    `Permissions are derived from user's groups (${Object.keys(user?.user_group_ids ?? {})})`
                  ) : (
                    <>
                      User has custom permissions{' '}
                      <Button type="link" onClick={() => setIsEditingUserPermissions(true)}>
                        View Details
                      </Button>
                    </>
                  )}
                </Col>
              </Row>
            </>
          )}
        </Form>
      </div>

      <div className="CustomModalBody">
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <Row>
          <Col xs={24} style={{ textAlign: 'right' }}>
            <Form.Item>
              <Button type="primary" onClick={updateUser}>
                Update User
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
