import { Button, Col, Divider, Form, Input, Modal, notification, Row, Switch } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';

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
  const [users, setUsers] = useState<User[]>([]);
  const isAdminVal = Form.useWatch('isadmin', form);
  const passwordVal = Form.useWatch('password', form);

  const resetModal = () => {
    form.resetFields();
  };

  const createUser = async () => {
    try {
      const formData = await form.validateFields();
      if (isAdminVal) {
        formData.networks = [];
      }
      if (!isServerEE) {
        formData.groups = ['*'];
      }
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

  const loadUsers = useCallback(async () => {
    try {
      const users = (await UsersService.getUsers()).data;
      setUsers(users);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (isAdminVal) {
      form.setFieldsValue({ networks: [] });
    }
  }, [form, isAdminVal]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
        <Form name="add-user-form" form={form} layout="vertical" initialValues={{ groups: ['*'], isadmin: true }}>
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
            <Switch
              disabled
              onChange={(newVal) => {
                if (newVal) {
                  form.setFieldValue('networks', []);
                }
              }}
            />
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
