import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select, Switch } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { isSaasBuild } from '@/services/BaseService';

interface AddUserModalProps {
  isOpen: boolean;
  onCreateUser: (user: User) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type CreateUserForm = User & { password: string; 'confirm-password': string };

export default function AddUserModal({ isOpen, onCreateUser, onCancel }: AddUserModalProps) {
  const [form] = Form.useForm<CreateUserForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSwitchDisabled, setIsSwitchDisabled] = useState(false);
  const passwordVal = Form.useWatch('password', form);

  const resetModal = () => {
    form.resetFields();
  };

  const createUser = async () => {
    try {
      const formData = await form.validateFields();
      // set issuperadmin as false
      formData.issuperadmin = false;
      const newUser = (await UsersService.createUser(formData)).data;
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

  const checkIfSwitchShouldBeDisabled = () => {
    if (store.user?.issuperadmin) {
      setIsSwitchDisabled(false);
    } else if (!isServerEE && !isSaasBuild) {
      setIsAdmin(true);
      setIsSwitchDisabled(true);
    } else {
      setIsSwitchDisabled(true);
    }
  };

  useEffect(() => {
    checkIfSwitchShouldBeDisabled();
  }, [store.user]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a User</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-user-form" form={form} layout="vertical" initialValues={{ isadmin: isAdmin }}>
          <Form.Item label="Username" name="username" rules={[{ required: true }]}>
            <Input placeholder="Username" />
          </Form.Item>

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

          <Form.Item label="Is admin" name="isadmin" valuePropName="checked">
            <Switch disabled={isSwitchDisabled} />
          </Form.Item>

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Button type="primary" onClick={createUser}>
                  Create User
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
