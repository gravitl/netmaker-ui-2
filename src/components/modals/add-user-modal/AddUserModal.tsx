import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select, Switch } from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
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

  const [users, setUsers] = useState<User[]>([]);
  const isAdminVal = Form.useWatch('isadmin', form);
  const passwordVal = Form.useWatch('password', form);

  const userGroups = useMemo(() => {
    const groups = new Set<string>();
    users.forEach((u) => u.groups?.forEach((g) => groups.add(g)));
    return Array.from(groups);
  }, [users]);

  const createUser = async () => {
    try {
      const formData = await form.validateFields();
      if (isAdminVal) {
        formData.networks = [];
      }
      const newUser = (await UsersService.createUser(formData)).data;
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
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-user-form" form={form} layout="vertical">
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
              onChange={(newVal) => {
                if (newVal) {
                  form.setFieldValue('networks', []);
                }
              }}
            />
          </Form.Item>

          <Form.Item label="User groups">
            <Row>
              <Col xs={18}>
                <Form.Item name="groups" noStyle>
                  <Select
                    mode="multiple"
                    placeholder="Groups"
                    options={userGroups.map((g) => ({ label: g, value: g }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                <Button
                  onClick={() => {
                    form.setFieldValue('groups', userGroups);
                  }}
                >
                  Select All
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item label="Allowed Networks">
            <Row>
              <Col xs={18}>
                <Form.Item name="networks" noStyle>
                  <Select
                    disabled={isAdminVal}
                    mode="multiple"
                    placeholder="Networks"
                    options={store.networks.map((n) => ({ label: n.netid, value: n.netid }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                <Button
                  disabled={isAdminVal}
                  onClick={() => {
                    form.setFieldValue(
                      'networks',
                      store.networks.map((n) => n.netid)
                    );
                  }}
                >
                  Select All
                </Button>
              </Col>
            </Row>
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
