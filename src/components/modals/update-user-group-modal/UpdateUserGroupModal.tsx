import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { UserGroup } from '@/models/UserGroup';

interface UpdateUserGroupModalProps {
  isOpen: boolean;
  group: UserGroup;
  onUpdateUserGroup: (userGroup: UserGroup) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type UpdateUserGroupForm = { usergroup: string; users: string[] };

export default function UpdateUserGroupModal({
  isOpen,
  group,
  onUpdateUserGroup,
  onCancel,
}: UpdateUserGroupModalProps) {
  const [form] = Form.useForm<UpdateUserGroupForm>();
  const [notify, notifyCtx] = notification.useNotification();

  const [users, setUsers] = useState<User[]>([]);
  const [initialUsers, setInitialUsers] = useState<User[]>([]);

  const updateUserGroup = async () => {
    try {
      const formData = await form.validateFields();
      const selectedUsers = formData.users ?? [];
      const removedUsers = initialUsers.filter((u) => !selectedUsers.includes(u.username));
      const addedUsers = users.filter((u) => selectedUsers.includes(u.username) && !initialUsers.includes(u));

      // loop through removed users and remove group from their groups
      removedUsers.forEach(async (u) => {
        const newGroups = u.groups?.filter((g) => g !== group) ?? [];
        await UsersService.updateUserDetails(u.username, { ...u, groups: newGroups });
      });

      // loop through added users and add group to their groups
      addedUsers.forEach(async (u) => {
        const newGroups = u.groups ? [...new Set([...u.groups, group])] : [group];
        await UsersService.updateUserDetails(u.username, { ...u, groups: newGroups });
      });

      notify.success({
        message: `User group ${formData.usergroup} updated`,
      });
      onUpdateUserGroup(formData.usergroup);
    } catch (err) {
      notify.error({
        message: 'Failed to correctly update user group',
        description: extractErrorMsg(err as any),
      });
    }
  };

  const loadUsersAndSetInitialUsers = useCallback(async () => {
    try {
      const users = (await UsersService.getUsers()).data;
      setUsers(users);
      setInitialUsers(users.filter((u) => u.groups?.includes(group)));
    } catch (err) {
      console.log(err);
    }
  }, [group]);

  useEffect(() => {
    loadUsersAndSetInitialUsers();
  }, [loadUsersAndSetInitialUsers]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update User Group</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form
          name="update-user-group-form"
          form={form}
          initialValues={{
            usergroup: group,
            users: initialUsers.map((u) => ({ label: u.username, value: u.username })),
          }}
          layout="vertical"
        >
          <Form.Item label="Group Name" name="usergroup" rules={[{ required: true }]}>
            <Input placeholder="Group name" disabled />
          </Form.Item>

          <Form.Item label="Users">
            <Row>
              <Col xs={18}>
                <Form.Item name="users" noStyle>
                  <Select
                    mode="multiple"
                    placeholder="Users"
                    options={users.filter((u) => !u.isadmin).map((u) => ({ label: u.username, value: u.username }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                <Button
                  onClick={() => {
                    form.setFieldValue(
                      'users',
                      users.filter((u) => !u.isadmin).map((u) => u.username),
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
                <Button type="primary" onClick={updateUserGroup}>
                  Update User Group
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
