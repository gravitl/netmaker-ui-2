import { Button, Col, Divider, Form, Input, Modal, notification, Row } from 'antd';
import { MouseEvent, useCallback } from 'react';
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
  isadmin: User['isadmin'];
};

type UpdateUserAuthForm = {
  isadmin: User['isadmin'];
};

export default function UpdateUserModal({ isOpen, user, onUpdateUser, onCancel }: UpdateUserModalProps) {
  const [form] = Form.useForm<UpdateUserForm>();
  const [authForm] = Form.useForm<UpdateUserAuthForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const passwordVal = Form.useWatch('password', form);

  const canChangePassword: (user: User) => [boolean, string] = useCallback(
    (user: User) => {
      if (store.user?.username === user.username) return [true, ''];
      if (user.auth_type === 'oauth') return [false, 'Cannot change password of an oauth user'];
      // if current user is super admin, they can change password of any other user
      if (store.user?.platform_role_id === 'super-admin') {
        return [true, ''];
      }
      if (store.user?.platform_role_id === 'admin') {
        if (user.platform_role_id === 'super-admin') {
          return [false, 'Cannot change password of the super admin'];
        }
        if (user.platform_role_id === 'admin') {
          return [false, "Cannot change another admin' password"];
        }
        return [true, ''];
      }
      return [false, 'Cannot change another user password'];
    },
    [store.user],
  );

  const updateUser = async () => {
    try {
      const formData = await form.validateFields();
      const { ['confirm-password']: confirmPwd, ...restFormData } = formData;

      let newUser: User = user;
      // super admin can update any user or user can update himself
      if (canChangePassword(user)[0]) {
        newUser = (await UsersService.updateUser(user.username, { ...user, ...restFormData })).data;
      } else {
        notification.error({ message: "Cannot update this user's password", description: canChangePassword(user)[1] });
        return;
      }
      notification.success({ message: `User ${newUser.username} updated` });
      onUpdateUser(newUser);
    } catch (err) {
      notification.error({
        message: 'Failed to update user',
        description: extractErrorMsg(err as any),
      });
    }
  };

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
            <Input
              disabled={!canChangePassword(user)[0]}
              placeholder="(unchanged)"
              type="password"
              title={canChangePassword(user)[1]}
            />
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
            <Input
              disabled={!canChangePassword(user)[0]}
              placeholder="(unchanged)"
              type="password"
              title={canChangePassword(user)[1]}
            />
          </Form.Item>
        </Form>
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
