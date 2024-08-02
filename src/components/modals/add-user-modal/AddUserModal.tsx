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
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User, UserGroup, UserRole, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { deriveUserRoleType } from '@/utils/UserMgmtUtils';
import { kebabCaseToTitleCase, snakeCaseToTitleCase } from '@/utils/Utils';

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
            <Select
              mode="multiple"
              placeholder="Select user roles for this network"
              allowClear
              options={rowData.roles.map((r) => ({ value: r.id, label: r.id }))}
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
      const networkRoles = (await UsersService.getRoles()).data.Response;
      const platformRoles = (await UsersService.getRoles('platform-role')).data.Response;
      setNetworkRoles(networkRoles);
      setPlatformRoles(
        platformRoles.filter((r) => !r.id.includes('super-admin')).sort((a, b) => a.id.localeCompare(b.id)),
      );
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
      payload['user_group_ids'] = {} as User['user_group_ids'];
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

  // useEffect(() => {
  //   form.setFieldValue('user-groups', []);
  // }, [platformRoleIdVal]);

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
                label="Platform Access Level"
                tooltip="This specifies the tenant-wide permissions this user will have"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  {platformRoles.map((role) => (
                    <Radio key={role.id} value={role.id}>
                      {kebabCaseToTitleCase(role.id)}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col xs={24}>
              <Form.Item
                name="role-assignment-type"
                label="How would you like to assign network roles to the user?"
                rules={[{ required: true }]}
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
                <Form.Item name="user-groups" label="Which groups will the user join" rules={[{ required: true }]}>
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
