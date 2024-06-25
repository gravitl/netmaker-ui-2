import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Table,
  TableColumnProps,
} from 'antd';
import { MouseEvent, Ref, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';

interface AddUserModalProps {
  isOpen: boolean;
  onCreateUser: (user: User) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  addUserButtonRef?: Ref<HTMLDivElement>;
  addUserNameInputRef?: Ref<HTMLDivElement>;
  addUserPasswordInputRef?: Ref<HTMLDivElement>;
  addUserSetAsAdminCheckboxRef?: Ref<HTMLDivElement>;
}

type CreateUserForm = User & { password: string; 'confirm-password': string };

interface NetworkRoles {
  id: string;
  network: string;
  roles: string[];
}

export default function AddUserModal({
  isOpen,
  onCreateUser,
  onCancel,
  addUserButtonRef,
  addUserNameInputRef,
  addUserPasswordInputRef,
  addUserSetAsAdminCheckboxRef,
}: AddUserModalProps) {
  const [form] = Form.useForm<CreateUserForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const passwordVal = Form.useWatch('password', form);
  const [networkRoles, setNetworkRoles] = useState<NetworkRoles[]>([
    {
      id: '1',
      network: 'netmaker',
      roles: ['network-user', 'network-admin', 'custom-role'],
    },
    {
      id: '2',
      network: 'private',
      roles: ['network-user', 'network-admin', 'custom-role'],
    },
    {
      id: '3',
      network: 'remote-net',
      roles: ['network-user', 'network-admin', 'field-worker'],
    },
  ]);

  const roleAssignmentTypeVal = Form.useWatch('role-assignment-type', form);

  const networkRolesTableCols: TableColumnProps<NetworkRoles>[] = [
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
      dataIndex: 'roles',
      width: '70%',
      render(roles) {
        return (
          <Select
            mode="multiple"
            placeholder="Select user roles for this network"
            allowClear
            options={roles.map((r: any) => ({ value: r, label: r }))}
          />
        );
      },
    },
  ];

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

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '60vw' }}>Create a User</span>}
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
        <Form name="add-user-form" form={form} layout="vertical">
          <Row ref={addUserNameInputRef}>
            <Col xs={24}>
              <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                <Input placeholder="Username" />
              </Form.Item>
            </Col>
          </Row>

          <Row ref={addUserPasswordInputRef}>
            <Col xs={24}>
              <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                <Input placeholder="Password" type="password" />
              </Form.Item>
            </Col>
          </Row>

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

          <Divider />

          <Row>
            <Col xs={24}>
              <Form.Item
                required
                name="role-assignment-type"
                label="How would you like to assign network roles to the user?"
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
                <Form.Item name="user-groups" label="Which groups will the user join">
                  <Select
                    mode="multiple"
                    placeholder="Select groups"
                    options={[
                      { label: 'group-1', value: 'Group 1' },
                      { label: 'group-2', value: 'Group 2' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {roleAssignmentTypeVal === 'by-manual' && (
            <Row>
              <Col xs={24}>
                <Form.Item label="Select the user's roles for each network">
                  <Table columns={networkRolesTableCols} dataSource={networkRoles} rowKey="id" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </div>

      <div className="CustomModalBody">
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <Row>
          <Col xs={24} style={{ textAlign: 'right' }}>
            <Form.Item>
              <Button type="primary" onClick={createUser}>
                Create User
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
