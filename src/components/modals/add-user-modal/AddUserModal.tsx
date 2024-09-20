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
  Skeleton,
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
import { kebabCaseToTitleCase, useServerLicense } from '@/utils/Utils';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';

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

const groupsTabKey = 'groups';
const customRolesTabKey = 'custom-roles';
const defaultTabKey = groupsTabKey;

export default function AddUserModal({
  isOpen,
  onCreateUser,
  onCancel,
  addUserNameInputRef,
  addUserPasswordInputRef,
}: AddUserModalProps) {
  const [form] = Form.useForm<CreateUserForm>();
  const [notify, notifyCtx] = notification.useNotification();

  const { isServerEE } = useServerLicense();
  const passwordVal = Form.useWatch('password', form);
  const [networkRoles, setNetworkRoles] = useState<UserRole[]>([]);
  const [platformRoles, setPlatformRoles] = useState<UserRole[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedNetworkRoles, setSelectedNetworkRoles] = useState<NetworkRolePair[]>([]);
  const [activeTab, setActiveTab] = useState(defaultTabKey);
  const [isLoadingPlatformRoles, setIsLoadingPlatformRoles] = useState(true);

  const palVal: UserRoleId = Form.useWatch('platform_role_id', form);

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
              options={rowData.roles
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((r) => ({ value: r.id, label: r.ui_name || r.id }))}
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
    } finally {
      setIsLoadingPlatformRoles(false);
    }
  }, [notify]);

  const createUser = async () => {
    try {
      const formData = await form.validateFields();

      const payload: any = {
        ...formData,
      };

      if (!isServerEE) payload['platform_role_id'] = 'admin';

      payload['network_roles'] = {} as User['network_roles'];
      payload['user_group_ids'] = {} as User['user_group_ids'];
      payload['user_group_ids'] = (formData['user-groups'] ?? []).reduce((acc, g) => ({ ...acc, [g]: {} }), {});
      selectedNetworkRoles.forEach((r) => {
        if (payload['network_roles'][r.network]) {
          payload['network_roles'][r.network][r.role] = {};
        } else {
          payload['network_roles'][r.network] = { [r.role]: {} };
        }
      });
      delete payload['user-groups'];
      delete payload['confirm-password'];
      delete payload['issuperadmin'];
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
    if (isOpen && isServerEE) {
      loadGroups();
      loadRoles();
    }
  }, [isOpen, isServerEE, loadGroups, loadRoles]);

  // ui components
  const getGroupsContent = useCallback(() => {
    return (
      <Row>
        <Col xs={24}>
          <Form.Item name="user-groups" label="Which groups will the user join">
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
  }, [groups]);

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

          {isServerEE && (
            <>
              <Divider />

              <Row>
                <Col xs={24}>
                  <Skeleton active loading={isLoadingPlatformRoles} paragraph={false}>
                    <Form.Item
                      name="platform_role_id"
                      label="Platform Access Level"
                      tooltip="This specifies the server-wide permissions this user will have"
                      rules={[{ required: true }]}
                      initialValue={isServerEE ? undefined : 'admin'}
                      extra={getPalDesc(palVal)}
                    >
                      <Radio.Group>
                        {platformRoles.map((role) => (
                          <Radio key={role.id} value={role.id} disabled={!isServerEE && !isAdminUserOrRole(role)}>
                            {kebabCaseToTitleCase(role.id)}
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                  </Skeleton>
                </Col>
              </Row>
            </>
          )}

          {!!palVal && isServerEE && !isAdminUserOrRole(palVal) && (
            <>
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
            </>
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
