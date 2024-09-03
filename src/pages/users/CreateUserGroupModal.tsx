import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Skeleton,
  Table,
  TableColumnProps,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import './UsersPage.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { User, UserGroup, UserRole } from '@/models/User';
import { Network } from '@/models/Network';
import { NetworksService } from '@/services/NetworksService';
import { convertNetworkPayloadToUiNetwork } from '@/utils/NetworkUtils';
import AddUsersToGroupModal from '@/components/modals/add-users-to-group-modal/AddUsersToGroupModal';

interface metadataFormValues {
  name: string;
  autoAssign: boolean;
  metadata: string;
  platformRole: UserRole['id'];
}

interface networkRolesFormValues {
  [key: Network['netid']]: UserRole['id'];
}

interface NetworkRolesTableData {
  network_id: UserRole['network_id'];
  network_roles: { roleId: UserRole['id']; uiName: UserRole['ui_name'] }[];
}

interface CreateUserGroupModalProps {
  isOpen: boolean;
  onCreateGroup?: (group: UserGroup) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  onClose?: () => void;
  showAddMembers?: boolean;
}

export default function CreateUserGroupModal({
  onCancel,
  isOpen,
  onCreateGroup,
  onClose,
  showAddMembers,
}: CreateUserGroupModalProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [metadataForm] = Form.useForm<metadataFormValues>();
  const [networkRolesForm] = Form.useForm<networkRolesFormValues>();
  const [availbleNetworks, setAvailbleNetworks] = useState<Network[]>([]);
  const [availableUserRoles, setAvailableUserRoles] = useState<UserRole[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const [membersSearch, setMembersSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);

  const filteredMembers = useMemo(() => {
    return groupMembers.filter((m) => m.username?.toLowerCase().includes(membersSearch.trim().toLowerCase()));
  }, [groupMembers, membersSearch]);

  const networkRolesTableData = useMemo<NetworkRolesTableData[]>(() => {
    return availbleNetworks.map((network) => ({
      network_id: network.netid,
      network_roles: availableUserRoles
        .filter((role) => role.network_id === network.netid)
        .map((role) => ({ uiName: role.ui_name, roleId: role.id })),
    }));
  }, [availbleNetworks, availableUserRoles]);

  const networkRolesTableCols = useMemo<TableColumnProps<NetworkRolesTableData>[]>(
    () => [
      {
        title: 'Network',
        dataIndex: 'network_id',
        width: '30%',
        // render: (network: string) => <Typography.Text>{network}</Typography.Text>,
      },
      {
        title: 'Role',
        render: (_, rowData) => (
          <Form.Item name={rowData.network_id} noStyle>
            <Select
              style={{ width: '100%' }}
              placeholder="Select a role for this network"
              options={[
                ...rowData.network_roles
                  .map((role) => ({ label: role.uiName || role.roleId, value: role.roleId }))
                  .sort((a, b) => a.label.localeCompare(b.label)),
                { label: 'n/a', value: '' },
              ]}
            />
          </Form.Item>
        ),
      },
    ],
    [],
  );

  const groupMembersTableCols = useMemo<TableColumnProps<User>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'username',
        render: (name: string) => <Typography.Text>{name}</Typography.Text>,
      },
      {
        title: '',
        width: '1rem',
        render: (_, rowData) => (
          <Button
            type="text"
            danger
            size="small"
            onClick={() => setGroupMembers(groupMembers.filter((m) => m.username !== rowData.username))}
          >
            Remove
          </Button>
        ),
      },
    ],
    [groupMembers],
  );

  const loadNetworks = useCallback(async () => {
    try {
      const networks = (await NetworksService.getNetworks()).data;
      setAvailbleNetworks(networks?.map(convertNetworkPayloadToUiNetwork) ?? []);
    } catch (e: any) {
      notify.error({ message: 'Failed to load networks. Reload page', description: extractErrorMsg(e) });
    } finally {
      setIsLoadingNetworks(false);
    }
  }, [notify]);

  const loadRoles = useCallback(async () => {
    try {
      const roles = (await UsersService.getRoles()).data.Response;
      setAvailableUserRoles(roles);
    } catch (e: any) {
      notify.error({ message: 'Failed to load roles. Reload page', description: extractErrorMsg(e) });
    }
  }, [notify]);

  const resetModal = useCallback(() => {
    metadataForm.resetFields();
    networkRolesForm.resetFields();
    setGroupMembers([]);
  }, [metadataForm, networkRolesForm]);

  const createGroup = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const metadata = await metadataForm.validateFields();
      const networkRoles = await networkRolesForm.validateFields();

      const networkRolesPayload = Object.keys(networkRoles).reduce(
        (acc, nw) => {
          if (networkRoles[nw]) acc[nw] = { [networkRoles[nw]]: {} };
          return acc;
        },
        {} as UserGroup['network_roles'],
      );

      const userGroup: UserGroup = (
        await UsersService.createGroup({
          members: groupMembers.map((m) => m.username),
          user_group: {
            id: metadata.name,
            network_roles: networkRolesPayload,
            meta_data: metadata.metadata,
            platform_role: metadata.platformRole,
          },
        })
      ).data.Response;

      notification.success({ message: 'User group created successfully' });
      resetModal();
      onCreateGroup?.(userGroup);
    } catch (e: any) {
      notify.error({ message: 'Failed to create user group', description: extractErrorMsg(e) });
    } finally {
      setIsSubmitting(false);
    }
  }, [groupMembers, metadataForm, networkRolesForm, notify, onCreateGroup, resetModal]);

  const platformRoleVal = Form.useWatch('platformRole', metadataForm);

  useEffect(() => {
    setGroupMembers([]);
  }, [platformRoleVal]);

  useEffect(() => {
    loadNetworks();
    loadRoles();
  }, [loadNetworks, loadRoles]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold', minWidth: '60vw' }}>Create User Group</span>}
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
        <Skeleton loading={isLoadingNetworks} active title className="page-padding">
          <Row style={{ paddingBottom: '0px' }}>
            <Col xs={24}>
              <Typography.Title level={4}>General</Typography.Title>
            </Col>
            <Form form={metadataForm} layout="vertical" style={{ width: '100%' }}>
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="Group Name"
                    rules={[{ required: true, whitespace: false }]}
                    style={{ width: '80%' }}
                  >
                    <Input placeholder="Enter a name for this new group" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                {/* <Col xs={24} md={12}>
                <Form.Item name="auto-assign" label="Auto-assign on startup">
                  <Switch />
                </Form.Item>
              </Col> */}
                <Col xs={24}>
                  <Form.Item name="metadata" label="Group Description" style={{ width: '80%' }}>
                    <Input.TextArea placeholder="Enter a description for this new group" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                {/* <Col xs={24}>
                  <Form.Item
                    name="platformRole"
                    label="Platform Access Level"
                    tooltip="The platform access level determines the level of access the user group has to the platform, and not one network specifically."
                    rules={[{ required: true, whitespace: false }]}
                    style={{ width: '80%' }}
                  >
                    <Select
                      placeholder="Select a platform access level"
                      style={{ width: '100%' }}
                      options={availableUserRoles
                        .filter((r) => deriveUserRoleType(r) === 'platform-role')
                        .map((r) => ({ label: r.id, value: r.id }))}
                    />
                  </Form.Item>
                </Col> */}
              </Row>
            </Form>
          </Row>

          <Row style={{ paddingBottom: '0px' }}>
            <Col xs={24}>
              <Card size="small" title="Associated Network Roles" style={{ width: '100%', marginBottom: '2rem' }}>
                <Form form={networkRolesForm}>
                  <Row style={{ padding: '.5rem 0rem' }} data-nmui-intercom="new-group_network-roles">
                    <Col xs={24}>
                      <Table
                        size="small"
                        columns={networkRolesTableCols}
                        dataSource={networkRolesTableData}
                        pagination={false}
                        scroll={{ x: 'auto' }}
                      />
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>
          </Row>

          {showAddMembers && (
            <Row style={{ paddingBottom: '5rem', paddingTop: '0px' }}>
              <Col xs={24}>
                <Card
                  size="small"
                  title="Group Members"
                  style={{ width: '100%' }}
                  extra={
                    <Button size="small" type="primary" onClick={() => setIsAddUserModalOpen(true)}>
                      <PlusOutlined /> Add User
                    </Button>
                  }
                >
                  <Row style={{ padding: '.5rem 0rem' }} data-nmui-intercom="new-group_network-roles">
                    <Col xs={24} style={{ paddingBottom: '1rem ' }}>
                      <Input
                        placeholder="Search for a user"
                        value={membersSearch}
                        onChange={(e) => setMembersSearch(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={24}>
                      <Table
                        size="small"
                        columns={groupMembersTableCols}
                        dataSource={filteredMembers}
                        pagination={{ pageSize: 25 }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          )}

          <Row>
            <Col xs={24} style={{ textAlign: 'end' }}>
              <Button type="primary" size="large" loading={isSubmitting} onClick={createGroup}>
                <PlusOutlined /> Create Group
              </Button>
            </Col>
          </Row>
        </Skeleton>
      </div>

      {/* misc */}
      {notifyCtx}

      {/* modals */}
      <AddUsersToGroupModal
        isOpen={isAddUserModalOpen}
        onCancel={() => setIsAddUserModalOpen(false)}
        currentGroupMembers={groupMembers}
        onUserSelected={(user) => {
          setGroupMembers([...groupMembers, user]);
        }}
        platformRole={platformRoleVal}
      />
    </Modal>
  );
}
