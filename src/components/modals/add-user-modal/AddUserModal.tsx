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
} from 'antd';
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User, UserGroup, UserRole, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { deriveUserRoleType } from '@/utils/UserMgmtUtils';

interface AddUserModalProps {
  isOpen: boolean;
  onCreateUser: (user: User) => any;
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
};

interface NetworkRolesTableData {
  network: string;
  roles: UserRole[];
}

interface NetworkRolePair {
  network: string;
  role: UserRoleId;
}

export default function AddUserModal({
  isOpen,
  onCreateUser,
  onCancel,
  addUserNameInputRef,
  addUserPasswordInputRef,
}: AddUserModalProps) {
  const [form] = Form.useForm<CreateUserForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const passwordVal = Form.useWatch('password', form);
  const [networkRoles, setNetworkRoles] = useState<UserRole[]>([]);
  const [platformRoles, setPlatformRoles] = useState<UserRole[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedNetworkRoles, setSelectedNetworkRoles] = useState<NetworkRolePair[]>([]);

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

  const platformRoleIdVal = Form.useWatch('platform_role_id', form);

  const networkRolesTableCols: TableColumnProps<NetworkRolesTableData>[] = useMemo(
    () => [
      {
        title: 'Network',
        dataIndex: 'network',
        width: '30%',
        // render(network: string) {
        //   return <Select placeholder="Select network" value={network} disabled />;
        // },
      },
      {
        title: 'Role',
        width: '70%',
        render(_, rowData) {
          return (
            <Select
              mode="multiple"
              placeholder="Select user roles for this network"
              allowClear
              options={rowData.roles.map((r) => ({ value: r.id, label: r.id }))}
              // onChange={(value) => {
              //   setSelectedNetworkRoles((prev) => [...new Set([...prev, ...value])]);
              // }}
              onSelect={(roleId: UserRole['id']) => {
                setSelectedNetworkRoles((prev) => {
                  return [...prev, { network: rowData.network, role: roleId }];
                });
              }}
              onDeselect={(roleId: UserRole['id']) => {
                setSelectedNetworkRoles((prev) =>
                  prev.filter((r) => r.network !== rowData.network && r.role !== roleId),
                );
              }}
            />
          );
        },
      },
    ],
    [],
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
      const roles = (await UsersService.getRoles()).data.Response;
      setNetworkRoles(roles.filter((r: UserRole) => deriveUserRoleType(r) === 'network-role'));
      setPlatformRoles(roles.filter((r: UserRole) => deriveUserRoleType(r) === 'platform-role'));
    } catch (err) {
      notify.error({
        message: 'Failed to load roles',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

  const createUser = async () => {
    try {
      const formData = await form.validateFields();
      // set issuperadmin as false
      formData.issuperadmin = false;

      const payload: any = {
        ...formData,
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
          selectedNetworkRoles.forEach((r) => {
            if (payload['network_roles'][r.network]) {
              payload['network_roles'][r.network][r.role] = {};
            } else {
              payload['network_roles'][r.network] = { [r.role]: {} };
            }
          });
          break;
      }
      delete payload['role-assignment-type'];
      delete payload['user-groups'];
      const newUser = (await UsersService.createUser(payload)).data;
      resetModal();
      notify.success({ message: `User ${newUser.username} created` });
      onCreateUser(newUser);
    } catch (err) {
      notify.error({
        message: 'Failed to create user',
        description: extractErrorMsg(err as any),
      });
    }
  };

  useEffect(() => {
    form.setFieldValue('user-groups', []);
  }, [platformRoleIdVal]);

  useEffect(() => {
    loadGroups();
    loadRoles();
  }, [loadGroups, loadRoles]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '60vw' }}>Create a User</span>}
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
        <Form name="add-user-form" form={form} layout="vertical">
          <Row ref={addUserNameInputRef}>
            <Col xs={24}>
              <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                <Input placeholder="Username" />
              </Form.Item>
            </Col>
          </Row>

          <Row ref={addUserPasswordInputRef}>
            <Col xs={24}>
              <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                <Input placeholder="Password" type="password" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Confirm Password"
            name="confirm-password"
            rules={[
              { required: true, message: '' },
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
            <Input placeholder="Confirm Password" type="password" />
          </Form.Item>

          <Divider />

          <Row>
            <Col xs={24}>
              <Form.Item
                name="platform_role_id"
                label="Platform Role"
                tooltip="This specifies the tenant-wide permissions this user will have"
                required
              >
                <Select
                  placeholder="Select a platform role for the user"
                  options={platformRoles.map((r) => ({ value: r.id, label: r.id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col xs={24}>
              <Form.Item
                required
                name="role-assignment-type"
                label="How would you like to assign network roles to the user?"
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
                <Form.Item name="user-groups" label="Which groups will the user join" required>
                  <Select
                    mode="multiple"
                    placeholder="Select groups"
                    options={groups.map((g) => ({
                      value: g.id,
                      label: g.id,
                      disabled: !!platformRoleIdVal && g.platform_role !== platformRoleIdVal,
                      title:
                        platformRoleIdVal && g.platform_role !== platformRoleIdVal
                          ? 'Disabled because the selected platform role conflicts with this group'
                          : '',
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
                  <Table columns={networkRolesTableCols} dataSource={networkRolesTableData} rowKey="id" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </div>

      <div className="CustomModalBody">
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <Row>
          <Col xs={24} style={{ textAlign: 'right' }}>
            <Form.Item>
              <Button type="primary" onClick={createUser}>
                Create User
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
