import {
  Button,
  Col,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Table,
  TableColumnsType,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { UsersService } from '@/services/UsersService';
import { User } from '@/models/User';
import { MoreOutlined } from '@ant-design/icons';

interface UpdateIngressModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  ingress: Node;
  onUpdateIngress: () => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface UpdateIngressForm {
  ingressdns: string;
}

export default function UpdateIngressModal({
  isOpen,
  onUpdateIngress,
  onCancel,
  ingress,
  networkId,
}: UpdateIngressModalProps) {
  const [form] = Form.useForm<UpdateIngressForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const storeUpdateNode = useStore().updateNode;
  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [ingressUsers, setIngressUsers] = useState<User[]>([]);

  const resetModal = () => {
    form.resetFields();
  };

  const updateIngress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      const newNode = (
        await NodesService.updateNode(ingress.id, networkId, { ...ingress, ingressdns: formData.ingressdns })
      ).data;
      storeUpdateNode(ingress.id, newNode);
      resetModal();
      notify.success({ message: `Ingress gateway updated` });
      onUpdateIngress();
    } catch (err) {
      notify.error({
        message: 'Failed to update ingress gateway',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setIsUsersLoading(true);
      const users = (await UsersService.getUsers()).data;
      const usersAttachedToIngress = (await NodesService.getUsersAttachedToGateway(ingress.id, networkId)).data.users;
      // remove admins and the superadmin from the list
      const filteredUsers = users.filter((user) => !user.isadmin && !user.issuperadmin);
      setUsers(filteredUsers);
      setIngressUsers(usersAttachedToIngress);
    } catch (err) {
      notify.error({
        message: 'Failed to load users',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsUsersLoading(false);
    }
  }, [notify, ingress.id, networkId]);

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
              await UsersService.removeUserFromRemoteGateway(user.username);
            } else {
              await UsersService.attachUserToRemoteGateway(user.username);
            }
          } catch (err) {
            notify.error({
              message: 'Failed to add/remove user',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, ingressUsers, ingress.id, getLinkText],
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
            <Typography.Link onClick={(_) => confirmAttachOrRemoveUser(user)}>{getLinkText(user)}</Typography.Link>
          );
        },
      },
    ],
    [getLinkText, confirmAttachOrRemoveUser],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers, isServerEE]);

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Ingress</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="update-ingress-form" form={form} layout="vertical" initialValues={ingress}>
        <div className="" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div className="CustomModalBody">
            <Form.Item name="ingressdns" label="Default External client DNS">
              <Input placeholder="DNS" />
            </Form.Item>
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button type="primary" onClick={updateIngress} loading={isSubmitting}>
                Update Ingress
              </Button>
            </Col>
          </Row>
        </div>
      </Form>
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />

      <Row className="" style={{ marginTop: '1rem', padding: '20px 24px' }}>
        <Typography.Title level={5}>Add / Remove users attached to this gateway</Typography.Title>
        <Col xs={24}>
          <Table columns={usersTableColumns} dataSource={users} rowKey="username" loading={isUsersLoading} />
        </Col>
      </Row>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
