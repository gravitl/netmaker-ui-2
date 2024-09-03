import { Network } from '@/models/Network';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Input, Modal, notification, Row, Table, TableColumnsType, Tooltip, Typography } from 'antd';
import { User } from '@/models/User';
import { Node } from '@/models/Node';
import { UsersService } from '@/services/UsersService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { SearchOutlined } from '@ant-design/icons';
import AddUserModal from '../add-user-modal/AddUserModal';
import { useServerLicense } from '@/utils/Utils';

interface UpdateIngressUsersModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  ingress: Node;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  remoteAccessManageUsersRef?: React.RefObject<HTMLDivElement>;
}

export default function UpdateIngressUsersModal({
  isOpen,
  ingress,
  onCancel,
  remoteAccessManageUsersRef,
}: UpdateIngressUsersModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersSearch, setUsersSearch] = useState<string>('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [ingressUsers, setIngressUsers] = useState<User[]>([]);
  const { isServerEE } = useServerLicense();

  const loadUsers = useCallback(async () => {
    try {
      setIsUsersLoading(true);
      const users = (await UsersService.getUsers()).data;
      const usersAttachedToIngress = (await UsersService.getIngressUsers(ingress.id)).data.users ?? [];
      // remove admins and the superadmin from the list
      // const filteredUsers = users.filter((user) => !user.isadmin && !user.issuperadmin);
      setUsers(users);
      setIngressUsers(usersAttachedToIngress);
    } catch (err) {
      notify.error({
        message: 'Failed to load users',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsUsersLoading(false);
    }
  }, [notify, ingress.id]);

  const getLinkText = useCallback(
    (user: User) => {
      const ingressUser = ingressUsers.find((ingressUser) => ingressUser.username === user.username);
      const isAttached = ingressUser?.remote_gw_ids?.[ingress.id];
      return isAttached ? 'Remove' : 'Attach';
    },
    [ingressUsers, ingress.id],
  );

  const confirmAttachOrRemoveUser = useCallback(
    async (user: User) => {
      Modal.confirm({
        title: `Are you sure you want to ${getLinkText(user).toLowerCase()} ${user.username}?`,
        onOk: async () => {
          const ingressUser = ingressUsers.find((ingressUser) => ingressUser.username === user.username);
          const isAttached = ingressUser?.remote_gw_ids?.[ingress.id];

          try {
            if (isAttached) {
              await UsersService.removeUserFromIngress(user.username, ingress.id);
            } else {
              await UsersService.attachUserToIngress(user.username, ingress.id);
            }

            loadUsers();
          } catch (err) {
            notify.error({
              message: 'Failed to add/remove user',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, ingressUsers, ingress.id, getLinkText, loadUsers],
  );

  const usersTableColumns: TableColumnsType<User> = useMemo(
    () => [
      {
        title: 'Username',
        dataIndex: 'username',
        sorter(a, b) {
          return a.username.localeCompare(b.username);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Actions',
        render(_, user) {
          return (
            <Tooltip
              title={
                user.isadmin || user.issuperadmin
                  ? 'Admins can access the gateway directly without needing to detach or attach permissions.'
                  : ''
              }
            >
              <Typography.Link
                onClick={() => confirmAttachOrRemoveUser(user)}
                disabled={user.isadmin || user.issuperadmin}
              >
                {getLinkText(user)}
              </Typography.Link>
            </Tooltip>
          );
        },
      },
    ],
    [getLinkText, confirmAttachOrRemoveUser],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      return u.username.toLowerCase().includes(usersSearch.trim().toLowerCase());
    });
  }, [users, usersSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, isServerEE]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add / Remove Users</span>}
      open={isOpen}
      onCancel={(ev) => {
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal"
      style={{ minWidth: '50vw' }}
    >
      <Row className="" style={{ marginTop: '1rem', padding: '20px 24px' }}>
        <Col xs={24} md={8}>
          <Input
            size="small"
            placeholder="Search users"
            prefix={<SearchOutlined />}
            value={usersSearch}
            onChange={(ev) => setUsersSearch(ev.target.value)}
            style={{ marginBottom: '1rem' }}
          />
        </Col>
        <Col xs={24} md={16} style={{ display: 'flex', justifyContent: 'end' }}>
          <Button className="full-width-button-xs" type="primary" onClick={() => setIsAddUserModalOpen(true)}>
            Add User
          </Button>
        </Col>
        <Col xs={24}>
          <div className="table-wrapper">
            <Table
              columns={usersTableColumns}
              dataSource={filteredUsers}
              rowKey="username"
              loading={isUsersLoading}
              size="small"
              ref={remoteAccessManageUsersRef}
            />
          </div>
        </Col>
      </Row>
      {notifyCtx}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onCreateUser={(user) => {
          setUsers([...users, user]);
          setIsAddUserModalOpen(false);
        }}
        onCancel={() => {
          setIsAddUserModalOpen(false);
        }}
      />
    </Modal>
  );
}
