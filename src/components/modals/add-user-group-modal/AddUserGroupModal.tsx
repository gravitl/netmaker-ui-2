import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select } from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { UserGroup } from '@/models/UserGroup';
import { useStore } from '@/store/store';

interface AddUserGroupModalProps {
  isOpen: boolean;
  onCreateUserGroup: (userGroup: UserGroup) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type CreateUserGroupForm = { usergroup: string; users: string[] };

export default function AddUserGroupModal({ isOpen, onCreateUserGroup, onCancel }: AddUserGroupModalProps) {
  const [form] = Form.useForm<CreateUserGroupForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const [users, setUsers] = useState<User[]>([]);

  const selectableUsers = useMemo(
    () =>
      users
        .filter((u) => !u.isadmin || (u.isadmin && u.username === store.username))
        .map((u) => ({ label: u.username, value: u.username })),
    [store.username, users],
  );

  const resetModal = () => {
    form.resetFields();
  };

  const createUserGroup = async () => {
    let groupName = '';
    let selectedUsers: User['username'][] = [];
    try {
      const formData = await form.validateFields();
      groupName = formData.usergroup;
      selectedUsers = formData.users ?? [];
      await UsersService.createUserGroup(formData.usergroup);
      resetModal();
      notify.success({
        message: `User group ${formData.usergroup} created`,
        description: formData.users?.length > 0 ? 'Adding users to the group...' : '',
      });
      onCreateUserGroup(formData.usergroup);
    } catch (err) {
      notify.error({
        message: 'Failed to create user group',
        description: extractErrorMsg(err as any),
      });
    }

    try {
      users.forEach(async (u) => {
        if (u.isadmin && u.username === store.username) {
          const newGroups = u.groups ? [...new Set([...u.groups, groupName])] : [groupName];
          await UsersService.updateAdminUser(u.username, { ...u, groups: newGroups });
          return;
        }
        if (selectedUsers.includes(u.username)) {
          const newGroups = u.groups ? [...new Set([...u.groups, groupName])] : [groupName];
          await UsersService.updateUserDetails(u.username, { ...u, groups: newGroups });
        }
      });
    } catch (err) {
      notify.warning({
        message: `Failed to add users to group ${groupName}`,
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
    loadUsers();
  }, [loadUsers]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a User Group</span>}
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
        <Form name="add-user-group-form" form={form} layout="vertical">
          <Form.Item label="Group Name" name="usergroup" rules={[{ required: true }]}>
            <Input placeholder="Group name" />
          </Form.Item>

          <Form.Item label="Users">
            <Row>
              <Col xs={18}>
                <Form.Item name="users" noStyle>
                  <Select mode="multiple" placeholder="Users" options={selectableUsers} />
                </Form.Item>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                <Button
                  onClick={() => {
                    form.setFieldValue('users', selectableUsers);
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
                <Button type="primary" onClick={createUserGroup}>
                  Create User Group
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
