import { Button, Col, Collapse, Divider, Form, Input, Modal, notification, Row, Select, Switch } from 'antd';
import { MouseEvent, useEffect } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { useStore } from '@/store/store';
import { confirmDirtyModalClose } from '@/utils/Utils';

interface UpdateUserModalProps {
  isOpen: boolean;
  user: User;
  onUpdateUser: (user: User) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type UpdateUserForm = {
  password: string;
  'confirm-password': string;
  networks: User['networks'];
  isadmin: User['isadmin'];
};

type UpdateUserAuthForm = {
  networks: User['networks'];
  isadmin: User['isadmin'];
};

export default function UpdateUserModal({ isOpen, user, onUpdateUser, onCancel }: UpdateUserModalProps) {
  const [form] = Form.useForm<UpdateUserForm>();
  const [authForm] = Form.useForm<UpdateUserAuthForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const networks = store.networks;
  const passwordVal = Form.useWatch('password', form);
  const isAdminVal = Form.useWatch('isadmin', authForm);

  const updateUser = async () => {
    try {
      const formData = await form.validateFields();
      const authFormData = await authForm.validateFields();

      let newUser: User = user;
      // you can only update your own password
      if (user.username === store.username && formData.password) {
        newUser = (await UsersService.updateUser(user.username, { username: user.username, ...formData })).data;
      }
      if (!user.isadmin) {
        newUser = (await UsersService.updateUserDetails(user.username, { ...user, ...authFormData })).data;
      }
      notify.success({ message: `User ${newUser.username} updated` });
      onUpdateUser(newUser);
    } catch (err) {
      notify.error({
        message: 'Failed to update user',
        description: extractErrorMsg(err as any),
      });
    }
  };

  useEffect(() => {
    if (isAdminVal) {
      authForm.setFieldValue('networks', []);
    }
  }, [authForm, isAdminVal]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update user {user.username || ''}</span>}
      open={isOpen}
      destroyOnClose
      onCancel={(ev) => {
        const shouldProceed = confirmDirtyModalClose([form, authForm]);
        if (shouldProceed) {
          onCancel?.(ev);
        }
      }}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="update-user-form" form={form} layout="vertical">
          <Form.Item label="Password" name="password">
            <Input disabled={user.username !== store.username} placeholder="(unchanged)" type="password" />
          </Form.Item>

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
            <Input disabled={user.username !== store.username} placeholder="(unchanged)" type="password" />
          </Form.Item>
        </Form>

        {!user.isadmin && (
          <Collapse ghost size="small" defaultActiveKey={user.username !== store.username ? ['user-auth'] : []}>
            <Collapse.Panel header="User authorizations" key="user-auth">
              <Form name="update-user-auth-form" form={authForm} layout="vertical" initialValues={user}>
                <Form.Item label="Is Admin" name="isadmin" valuePropName="checked">
                  <Switch />
                </Form.Item>

                <Form.Item label="Allowed networks" name="networks">
                  <Select
                    placeholder="Select networks to give user access to"
                    disabled={isAdminVal}
                    mode="multiple"
                    options={networks.map((n) => ({ label: n.netid, value: n.netid }))}
                  />
                </Form.Item>
              </Form>
            </Collapse.Panel>
          </Collapse>
        )}

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
