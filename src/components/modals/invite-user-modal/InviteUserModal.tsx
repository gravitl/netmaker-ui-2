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
  Steps,
  Table,
  TableColumnProps,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User, UserGroup, UserInvite, UserRole, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { DeleteOutlined } from '@ant-design/icons';
import { copyTextToClipboard, snakeCaseToTitleCase } from '@/utils/Utils';
import { getInviteMagicLink } from '@/utils/RouteUtils';
import CreateUserGroupModal from '@/pages/users/CreateUserGroupModal';

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

export default function InviteUserModal({ isOpen, onInviteFinish, onClose, onCancel }: InviteUserModalProps) {
  const [form] = Form.useForm<UserInviteForm>();
  const [notify, notifyCtx] = notification.useNotification();
  // const store = useStore();

  // const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [currentStep, setCurrentStep] = useState(0);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [userInvites, setUserInvites] = useState<UserInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [networkRoles, setNetworkRoles] = useState<UserRole[]>([]);
  const [platformRoles, setPlatformRoles] = useState<UserRole[]>([]);
  const [selectedNetworkRoles, setSelectedNetworkRoles] = useState<NetworkRolePair[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const userGroupsVal = Form.useWatch('user-groups', form);

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
      setPlatformRoles(platformRoles);
    } catch (err) {
      notify.error({
        message: 'Failed to load roles',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

  const inviteUser = async () => {
    try {
      const formData = await form.validateFields();

      const payload: any = {
        ...formData,
      };

      payload['network_roles'] = {} as User['network_roles'];
      payload['user_group_ids'] = {} as User['user_group_ids'];
      switch (formData['role-assignment-type']) {
        case 'by-group':
          payload['network_roles'] = {};
          payload['user_group_ids'] = formData['user-groups'].reduce((acc, g) => ({ ...acc, [g]: {} }), {});
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
    }
  };

  const roleAssignmentTypeVal = Form.useWatch('role-assignment-type', form);

  useEffect(() => {
    loadRoles();
    loadGroups();
  }, [loadGroups, loadRoles]);

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
                          {snakeCaseToTitleCase(role.id)}
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
                        options={[
                          ...groups.map((g) => ({
                            value: g.id,
                            label: g.id,
                            // disabled: !!platformRoleIdVal && g.platform_role !== platformRoleIdVal,
                            // title:
                            //   platformRoleIdVal && g.platform_role !== platformRoleIdVal
                            //     ? 'Disabled because the selected platform access level conflicts with this group'
                            //     : '',
                          })),
                          {
                            label: '+ Create a new group',
                            value: 'create-new-group',
                          },
                        ]}
                        onSelect={(opt) => {
                          if (opt === 'create-new-group') {
                            form.setFieldValue('user-groups', userGroupsVal ?? []);
                            setIsCreateGroupModalOpen(true);
                          }
                        }}
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
                            await copyTextToClipboard(getInviteMagicLink(invite.invite_code, invite.email));
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
                <Button type="primary" onClick={inviteUser}>
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
