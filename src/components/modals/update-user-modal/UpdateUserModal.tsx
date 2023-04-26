import { Button, Col, Divider, Form, Input, Modal, notification, Row } from 'antd';
import { MouseEvent } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';

interface UpdateUserModalProps {
  isOpen: boolean;
  user: User;
  onUpdateUser: (user: User) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type UpdateUserForm = { password: string; 'confirm-password': string };

export default function UpdateUserModal({ isOpen, user, onUpdateUser, onCancel }: UpdateUserModalProps) {
  const [form] = Form.useForm<UpdateUserForm>();
  const [notify, notifyCtx] = notification.useNotification();

  const passwordVal = Form.useWatch('password', form);

  const updateUser = async () => {
    try {
      const formData = await form.validateFields();

      const newUser = (await UsersService.updateUser(user.username, { username: user.username, ...formData })).data;
      notify.success({ message: `User ${newUser.username} updated` });
      onUpdateUser(newUser);
    } catch (err) {
      notify.error({
        message: 'Failed to update user',
        description: extractErrorMsg(err as any),
      });
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update user {user.username || ''}</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-user-form" form={form} layout="vertical">
          <Form.Item label="Password" name="password" rules={[{ required: true }]}>
            <Input placeholder="Password" type="password" />
          </Form.Item>

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

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Button type="primary" onClick={updateUser}>
                  Update User
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
