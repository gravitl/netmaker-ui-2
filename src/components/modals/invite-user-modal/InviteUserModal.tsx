import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  List,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Skeleton,
  Steps,
  Table,
  TableColumnProps,
  Tabs,
  TabsProps,
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User, UserGroup, UserInvite, UserRole, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { DeleteOutlined } from '@ant-design/icons';
import { copyTextToClipboard, kebabCaseToTitleCase, useServerLicense } from '@/utils/Utils';
import CreateUserGroupModal from '@/pages/users/CreateUserGroupModal';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';

interface InviteUserModalProps {
  isOpen: boolean;
  onInviteFinish: () => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  onClose?: () => void;
}

interface UserInviteForm {
  user_emails: string;
  user_group_ids: UserGroup['id'][];
  'role-assignment-type': 'by-group' | 'by-manual';
  'user-groups': UserGroup['id'][];
  platform_role_id: UserRoleId;
}

interface NetworkRolePair {
  network: string;
  role: UserRoleId;
}

interface NetworkRolesTableData {
  network: string;
  roles: UserRole[];
}

const inviteUserSteps = [
  {
    position: 0,
    title: 'User Details',
  },
  {
    position: 1,
    title: 'Summary',
  },
];

const groupsTabKey = 'groups';
const customRolesTabKey = 'custom-roles';
const defaultTabKey = groupsTabKey;

export default function InviteUserModal({ isOpen, onInviteFinish, onClose, onCancel }: InviteUserModalProps) {
  const [form] = Form.useForm<UserInviteForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const { isServerEE } = useServerLicense();

  const [currentStep, setCurrentStep] = useState(0);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [userInvites, setUserInvites] = useState<UserInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [networkRoles, setNetworkRoles] = useState<UserRole[]>([]);
  const [platformRoles, setPlatformRoles] = useState<UserRole[]>([]);
  const [selectedNetworkRoles, setSelectedNetworkRoles] = useState<NetworkRolePair[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTabKey);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingPlatformRoles, setIsLoadingPlatformRoles] = useState(true);

  const userGroupsVal = Form.useWatch('user-groups', form);
  const palVal = Form.useWatch('platform_role_id', form);

  const resetModal = () => {
    setCurrentStep(0);
    form.resetFields();
  };

  const onNextStep = () => {
    const maxNumOfStepsIndex = inviteUserSteps.length - 1;
    // if on last step
    if (currentStep === maxNumOfStepsIndex) {
      onInviteFinish?.();
      resetModal();
      onClose?.();
      return;
    }

    setCurrentStep(currentStep + 1);
  };

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

  const loadGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      const groups = (await UsersService.getGroups()).data.Response;
      setGroups(groups);
    } catch (err) {
      notify.error({
        message: 'Failed to load groups',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsLoadingGroups(false);
    }
  }, [notify]);

  const loadInvites = useCallback(async () => {
    try {
      setIsLoadingInvites(true);
      const inviteeEmails: string[] =
        form
          .getFieldValue('user_emails')
          ?.split(',')
          ?.map((e: string) => e.trim()) ?? [];
      const invites = (await UsersService.getUserInvites()).data.Response;
      setUserInvites(invites.filter((i) => inviteeEmails.includes(i.email)));
    } catch (err) {
      onClose?.();
      notify.info({
        message: 'To see the invites, open the Invites tab',
      });
    } finally {
      setIsLoadingInvites(false);
    }
  }, [form, notify, onClose]);

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

  const inviteUser = async () => {
    try {
      const formData = await form.validateFields();
      setIsCreating(true);

      const payload: any = {
        ...formData,
      };

      if (!isServerEE) payload['platform_role_id'] = 'admin';

      payload['network_roles'] = {} as User['network_roles'];
      payload['user_group_ids'] = {} as User['user_group_ids'];
      payload['user_group_ids'] = (formData['user-groups'] ?? []).reduce((acc, g) => ({ ...acc, [g]: {} }), {}) ?? {};
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

      await UsersService.createUserInvite({
        user_emails: payload.user_emails.split(',').map((e: string) => e.trim()),
        user_group_ids: payload.user_group_ids,
        platform_role_id: payload.platform_role_id,
        network_roles: payload.network_roles,
      });
      loadInvites();
      notify.success({ message: `User invites successfully created` });
      onNextStep();
    } catch (err) {
      notify.error({
        message: 'Failed to create user invites',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      loadGroups();
    }
  }, [isOpen, loadGroups, loadRoles]);

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
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '60vw' }}>Invite users</span>}
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
        <Row justify="center" style={{ marginBottom: '2rem' }}>
          <Col xs={24}>
            <Steps current={inviteUserSteps[currentStep].position} items={inviteUserSteps} />
          </Col>
        </Row>

        {/* step 1 */}
        {currentStep === 0 && (
          <>
            <Form name="invite-user-form" form={form} layout="vertical">
              <Row>
                <Col xs={24}>
                  <Form.Item
                    label="Email address(es)"
                    name="user_emails"
                    rules={[{ required: true, whitespace: true }]}
                  >
                    <Input.TextArea placeholder="Multiple email addresses must be separated by commas. eg: user@example.com,user2@example.com" />
                  </Form.Item>
                </Col>
              </Row>

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
          </>
        )}

        {/* step 2 */}
        {currentStep === 1 && (
          <>
            <Row>
              <Col xs={24}>
                <List size="small" header="Invited Users" bordered loading={isLoadingInvites}>
                  {userInvites.map((invite) => (
                    <List.Item
                      key={invite.email}
                      actions={[
                        <Button
                          key="copy-link"
                          type="link"
                          style={{ marginRight: '1rem' }}
                          onClick={async () => {
                            await copyTextToClipboard(invite.invite_url);
                            notify.success({ message: 'Invite code copied to clipboard' });
                          }}
                        >
                          Copy Invite Link
                        </Button>,
                        <Button
                          key="delete"
                          type="link"
                          onClick={async () => {
                            try {
                              await UsersService.deleteUserInvite(invite.email);
                              setUserInvites((invites) => invites.filter((i) => i.email !== invite.email));
                            } catch (err) {
                              notify.error({
                                message: `Failed to delete user invite for ${invite.email}`,
                                description: extractErrorMsg(err as any),
                              });
                            }
                          }}
                        >
                          <DeleteOutlined />
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={invite.email}
                        description={
                          Object.keys(invite.user_group_ids ?? {})?.length
                            ? `Groups: ${Object.keys(invite.user_group_ids ?? {})?.join(', ')}`
                            : undefined
                        }
                      />
                    </List.Item>
                  ))}
                </List>
              </Col>
            </Row>
          </>
        )}
      </div>

      <div className="CustomModalBody">
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />

        {/* step 1 */}
        {currentStep === 0 && (
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Button type="primary" onClick={inviteUser} loading={isCreating}>
                  Create User Invite(s)
                </Button>
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* step 2 */}
        {currentStep === 1 && (
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Button type="primary" onClick={onNextStep}>
                  Finish
                </Button>
              </Form.Item>
            </Col>
          </Row>
        )}
      </div>

      {/* notify */}
      {notifyCtx}
      <CreateUserGroupModal
        isOpen={isCreateGroupModalOpen}
        showAddMembers={false}
        onCreateGroup={(group) => {
          setGroups((prev) => [...prev, group]);
          form.setFieldValue('user-groups', [...(userGroupsVal ?? []), group.id]);
          setIsCreateGroupModalOpen(false);
        }}
        onCancel={() => {
          setIsCreateGroupModalOpen(false);
        }}
        onClose={() => {
          setIsCreateGroupModalOpen(false);
        }}
      />
    </Modal>
  );
}
