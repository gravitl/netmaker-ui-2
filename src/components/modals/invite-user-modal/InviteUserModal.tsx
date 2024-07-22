import { Button, Col, Divider, Form, Input, List, Modal, notification, Row, Select, Steps } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UserGroup, UserInvite } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { DeleteOutlined } from '@ant-design/icons';
import { copyTextToClipboard } from '@/utils/Utils';

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

  const resetModal = () => {
    form.resetFields();
  };

  const onNextStep = () => {
    const maxNumOfStepsIndex = inviteUserSteps.length - 1;
    // if on last step
    if (currentStep === maxNumOfStepsIndex) {
      onInviteFinish?.();
      onClose?.();
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const inviteUser = async () => {
    try {
      const formData = await form.validateFields();
      const invites = (
        await UsersService.createUserInvite({
          user_emails: formData.user_emails.split(',').map((e: string) => e.trim()),
          groups: formData.groups,
        })
      ).data;
      setUserInvites((invites as unknown as UserInvite[]) || []);
      setUserInvites([
        {
          email: 'user1@example.com',
          groups: ['all', 'users'],
          inviteCode: '12QASWE1',
        },
        {
          email: 'user2@example.com',
          groups: ['all', 'users'],
          inviteCode: '12QASWE2',
        },
      ]);
      resetModal();
      notify.success({ message: `User invites successfully created` });
      onNextStep();
    } catch (err) {
      notify.error({
        message: 'Failed to create user invites',
        description: extractErrorMsg(err as any),
      });
    }
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
                      options={groups.map((g: UserGroup) => ({ value: g.id, label: g.id }))}
                      mode="multiple"
                      placeholder="Select groups the user(s) should be assigned to"
                      loading={isLoadingGroups}
                      allowClear
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
                <List size="small" header="Invited Users" bordered>
                  {userInvites.map((invite) => (
                    <List.Item
                      key={invite.email}
                      actions={[
                        <Button
                          key="copy-link"
                          type="link"
                          style={{ marginRight: '1rem' }}
                          onClick={async () => {
                            // TODO: get link from server res
                            await copyTextToClipboard(`https://example.com/invite/${invite.inviteCode}`);
                            notify.success({ message: 'Magic link copied to clipboard' });
                          }}
                        >
                          Copy Magic Link
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
                      <List.Item.Meta title={invite.email} description={`Groups: ${invite.groups.join(', ')}`} />
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
