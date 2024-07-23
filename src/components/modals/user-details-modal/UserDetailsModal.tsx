import { Button, Col, Divider, Form, Modal, notification, Row, Table, TableColumnProps, Typography } from 'antd';
import { MouseEvent, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { User } from '@/models/User';

interface UserDetailsModalProp {
  isOpen: boolean;
  user: User;
  onUpdateUser: () => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface NetworkRoles {
  id: string;
  network: string;
  roles: string[];
}

export default function UserDetailsModal({ isOpen, user, onUpdateUser, onCancel }: UserDetailsModalProp) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
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
  const isUserInGroup = user.user_group_ids?.length;

  const networkRolesTableCols: TableColumnProps<NetworkRoles>[] = [
    {
      title: 'Network',
      dataIndex: 'network',
      width: '30%',
    },
    {
      title: 'Role',
      dataIndex: 'roles',
      width: '70%',
      render(roles) {
        return roles.join(', ');
      },
    },
  ];

  return (
    <Modal
      title={
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: isUserInGroup ? '' : '60vw' }}>
          User Details
        </span>
      }
      open={isOpen}
      onCancel={(ev) => {
        onCancel?.(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
      style={{ minWidth: '60vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Row data-nmui-intercom="user-details_username">
          <Col xs={8}>
            <Typography.Text>Username</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{user.username}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row data-nmui-intercom="user-details_permission">
          <Col xs={8}>
            <Typography.Text>
              User permission model{' '}
              <InfoCircleOutlined title="Whether this user derives permmissions from the groups they belong in or the permisisons were set manually" />
            </Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>
              {isUserInGroup
                ? `Permissions are derived from these groups: ${Object.keys(user.user_group_ids).join(', ')}`
                : 'Permissions are assigned manually'}
            </Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        {!isUserInGroup && (
          <>
            <Row data-nmui-intercom="user-details_platform-role">
              <Col xs={8}>
                <Typography.Text>Platform Role</Typography.Text>
              </Col>
              <Col xs={16}>
                <Typography.Text>{user.platform_role_id}</Typography.Text>
              </Col>
            </Row>
            <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

            <Row data-nmui-intercom="user-details_network-roles">
              <Col xs={24}>
                <Typography.Text>Network Roles</Typography.Text>
              </Col>
              <Col xs={24} style={{ marginTop: '2rem' }}>
                <Table columns={networkRolesTableCols} dataSource={networkRoles} rowKey="id" />
              </Col>
            </Row>
            <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
          </>
        )}
      </div>

      <div className="CustomModalBody">
        <Row>
          <Col xs={24} style={{ textAlign: 'start' }}>
            <Form.Item>
              <Button type="default" onClick={onUpdateUser}>
                <EditOutlined />
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
