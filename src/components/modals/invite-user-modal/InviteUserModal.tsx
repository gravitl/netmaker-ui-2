import { Button, Col, Divider, Form, Input, List, Modal, notification, Row, Select, Steps } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UserGroup, UserInvite, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { DeleteOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '@/utils/Utils';
import { getInviteMagicLink } from '@/utils/RouteUtils';

interface InviteUserModalProps {
  isOpen: boolean;
  onInviteFinish: () => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  onClose?: () => void;
}

interface UserInviteForm {
  user_emails: string;
  groups: UserGroup['id'][];
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
  const [permittedPlatformRole, setPermittedPlatformRole] = useState<UserRoleId>('');

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

  const inviteUser = async () => {
    try {
      const formData = await form.validateFields();
      await UsersService.createUserInvite({
        user_emails: formData.user_emails.split(',').map((e: string) => e.trim()),
        groups: formData.groups,
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

  const groupsVal = Form.useWatch('groups', form);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

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
                  <Form.Item label="Email address(es)" name="user_emails" rules={[{ required: true }]}>
                    <Input.TextArea placeholder="Multiple email addresses must be separated by commas. eg: user@example.com,user2@example.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row>
                <Col xs={24}>
                  <Form.Item
                    label="Groups"
                    name="groups"
                    tooltip="Invited users will be automatically assigned to these groups"
                  >
                    <Select
                      options={groups.map((g: UserGroup) => ({
                        value: g.id,
                        label: g.id,
                        disabled: !!permittedPlatformRole && g.platform_role !== permittedPlatformRole,
                        title:
                          permittedPlatformRole && g.platform_role !== permittedPlatformRole
                            ? `This group's platform role (${g.platform_role}) does not match the previously selected group's (${permittedPlatformRole})`
                            : '',
                      }))}
                      mode="multiple"
                      placeholder="Select groups the user(s) should be assigned to"
                      loading={isLoadingGroups}
                      allowClear
                      onSelect={(val) => {
                        if (permittedPlatformRole) {
                          return;
                        }
                        setPermittedPlatformRole(groups.find((g) => g.id === val)?.platform_role ?? '');
                      }}
                      onDeselect={() => {
                        if (!groupsVal || groupsVal?.length <= 1) {
                          setPermittedPlatformRole('');
                        }
                      }}
                      onClear={() => {
                        setPermittedPlatformRole('');
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
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
                        description={`Groups: ${invite.groups?.join(', ') ?? 'n/a'}`}
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

        {/* step 2 */}
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
    </Modal>
  );
}
