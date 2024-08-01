import { Button, Col, Divider, Form, Input, Modal, notification, Row, Table } from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { SearchOutlined } from '@ant-design/icons';
import { User, UserRoleId } from '@/models/User';
import { UsersService } from '@/services/UsersService';

interface AddUsersToGroupModalProps {
  isOpen: boolean;
  currentGroupMembers: User[];
  onUserSelected: (user: User) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  platformRole?: UserRoleId;
}

export default function AddUsersToGroupModal({
  isOpen,
  currentGroupMembers,
  onUserSelected,
  onCancel,
  platformRole,
}: AddUsersToGroupModalProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [usersSearch, setUsersSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const filteredUsers = useMemo<User[]>(() => {
    return users
      .filter((u) => !currentGroupMembers.map((m) => m.username).includes(u.username))
      .filter((u) => u.username.toLocaleLowerCase().includes(usersSearch.toLocaleLowerCase()));
  }, [currentGroupMembers, users, usersSearch]);

  const resetModal = () => {};

  const loadUsers = useCallback(async () => {
    try {
      const users = (await UsersService.getUsers()).data;
      setUsers(users);
    } catch (err) {
      notify.error({
        message: 'Failed to load users',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

  useEffect(() => {
    loadUsers();
  }, [isOpen, loadUsers]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add Users to group</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal AddUsersToGroupModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-users-to-group-form" layout="vertical">
        <div className="CustomModalBody">
          <Row>
            <Col xs={24}>
              <Input
                placeholder="Search users"
                value={usersSearch}
                onChange={(ev) => setUsersSearch(ev.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: '1rem' }}>
            <Col xs={24}>
              <div className="table-wrapper">
                <Table
                  size="small"
                  // dataSource={users}
                  dataSource={filteredUsers}
                  pagination={{ pageSize: 25, hideOnSinglePage: true }}
                  columns={[
                    {
                      title: 'Username',
                      dataIndex: 'username',
                      sorter: (a, b) => a.username.localeCompare(b.username),
                      defaultSortOrder: 'ascend',
                    },
                    {
                      align: 'right',
                      width: '1rem',
                      render(_, user) {
                        return (
                          <Button
                            size="small"
                            onClick={() => onUserSelected(user)}
                            disabled={platformRole ? user.platform_role_id !== platformRole : false}
                            title={
                              platformRole && user.platform_role_id !== platformRole
                                ? `User's platform access lavel (${user.platform_role_id}) conflicts with this groups platform access level (${platformRole})`
                                : ''
                            }
                          >
                            Add To Group
                          </Button>
                        );
                      },
                    },
                  ]}
                  rowKey="username"
                  scroll={{ x: true }}
                />
              </div>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'left' }}>
              <Button
                type="primary"
                onClick={(ev) => {
                  onCancel?.(ev as any);
                }}
              >
                Close
              </Button>
            </Col>
          </Row>
        </div>
      </Form>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
