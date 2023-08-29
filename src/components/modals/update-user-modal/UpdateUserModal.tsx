import { Button, Col, Collapse, Divider, Form, Input, Modal, notification, Row, Select, Switch } from 'antd';
import { MouseEvent, useCallback, useEffect } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { useStore } from '@/store/store';
import { confirmDirtyModalClose } from '@/utils/Utils';
import { isSaasBuild } from '@/services/BaseService';

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

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const passwordVal = Form.useWatch('password', form);

  const updateUser = async () => {
    try {
      const formData = await form.validateFields();
      const { ['confirm-password']: confirmPwd, ...restFormData } = formData;

      let newUser: User = user;
      // super admin can update any user or user can update himself
      if (
        store.user?.issuperadmin ||
        (store.user?.isadmin && !user.isadmin) ||
        (user.username === store.username && formData.password)
      ) {
        newUser = (await UsersService.updateUser(user.username, { ...user, ...restFormData })).data;
      } else {
        notify.error({ message: 'You are not authorized to update this user' });
        return;
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

  const shouldInputBeDisabled = useCallback(() => {
    if (store.user?.issuperadmin) {
      return false;
    } else if (user.isadmin && user.username !== store.username) {
      return true;
    }
    return false;
  }, [store.user?.issuperadmin, user.username, store.username]);

  const checkIfSwitchShouldBeDisabled = useCallback(() => {
    if (store.user?.issuperadmin) {
      return false;
    } else if (!isServerEE && !isSaasBuild) {
      return true;
    } else {
      return true;
    }
  }, [isServerEE, isSaasBuild, store.user?.issuperadmin]);

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
            <Input disabled={shouldInputBeDisabled()} placeholder="(unchanged)" type="password" />
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
            <Input disabled={shouldInputBeDisabled()} placeholder="(unchanged)" type="password" />
          </Form.Item>

          {store.user?.issuperadmin && (
            <Collapse ghost size="small" defaultActiveKey={user.username !== store.username ? ['user-auth'] : []}>
              <Collapse.Panel header="User authorizations" key="user-auth">
                <Form.Item label="Is Admin" name="isadmin" valuePropName="checked" initialValue={user.isadmin}>
                  <Switch disabled={checkIfSwitchShouldBeDisabled()} />
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          )}
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
