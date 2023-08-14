import {
  Col,
  Divider,
  Modal,
  notification,
  Row,
  Select,
  Switch,
  Table,
  TableColumnsType,
  Tabs,
  TabsProps,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { User } from '@/models/User';
import { UsersService } from '@/services/UsersService';
import { Network } from '@/models/Network';
import { UserGroup } from '@/models/UserGroup';
import { NetworksService } from '@/services/NetworksService';
import { convertNetworkPayloadToUiNetwork, convertUiNetworkToNetworkPayload } from '@/utils/NetworkUtils';
import { ProSettings } from '@/models/ProSettings';
import { NULL_NETWORK_PROSETTINGS } from '@/constants/Types';

interface NetworkPermissionsModalProps {
  isOpen: boolean;
  network: Network;
  onUpdate: (network: Network) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface GroupsTableData {
  name: string;
  permission: boolean;
}

type UserTableData = User & { permission: boolean };

const accessLevels = [
  { label: '0 - Network Admin', value: 0 },
  { label: '1 - Node Access', value: 1 },
  { label: '2 - Remote Access', value: 2 },
  { label: '3 - No Access', value: 3 },
];

export default function NetworkPermissionsModal({ isOpen, network, onUpdate, onCancel }: NetworkPermissionsModalProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [shouldDisplayAllGroups, setShouldDisplayAllGroups] = useState(false);
  const [shouldDisplayAllUsers, setShouldDisplayAllUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const updateGroupPermissions = useCallback(
    async (newVal: boolean, group: GroupsTableData) => {
      try {
        const newUserGroups = new Set(network.prosettings?.allowedgroups);
        if (newVal) {
          newUserGroups.add(group.name);
        } else {
          newUserGroups.delete(group.name);
        }
        const networkPayload = convertUiNetworkToNetworkPayload(network);
        const newNetwork = (
          await NetworksService.updateNetwork(network.netid, {
            ...networkPayload,
            prosettings: { ...(network.prosettings ?? NULL_NETWORK_PROSETTINGS), allowedgroups: [...newUserGroups] },
          })
        ).data;
        onUpdate(convertNetworkPayloadToUiNetwork(newNetwork));
        notify.success({ message: `Updated network permissions for group ${group.name}` });
      } catch (err) {
        notify.error({
          message: 'Failed to update network permissions',
          description: extractErrorMsg(err as any),
        });
      }
    },
    [network, notify, onUpdate],
  );

  const updateUserPermissions = useCallback(
    async (newVal: boolean, user: UserTableData) => {
      try {
        const newUserNetworks = new Set(user.networks);
        if (newVal) {
          newUserNetworks.add(network.netid);
        } else {
          newUserNetworks.delete(network.netid);
        }
        await UsersService.updateUserDetails(user.username, { ...user, networks: [...newUserNetworks] });

        const newNetworkUsers = new Set(network.prosettings?.allowedusers);
        if (newVal) {
          newNetworkUsers.add(user.username);
        } else {
          newNetworkUsers.delete(user.username);
        }
        const networkPayload = convertUiNetworkToNetworkPayload(network);
        const newNetwork = (
          await NetworksService.updateNetwork(network.netid, {
            ...networkPayload,
            prosettings: {
              ...(networkPayload.prosettings ?? NULL_NETWORK_PROSETTINGS),
              allowedusers: [...newUserNetworks],
            },
          })
        ).data;
        onUpdate(convertNetworkPayloadToUiNetwork(newNetwork));
        notify.success({ message: `Updated network permissions for user ${user.username}` });
      } catch (err) {
        notify.error({
          message: 'Failed to update network permissions',
          description: extractErrorMsg(err as any),
        });
      }
    },
    [network, notify, onUpdate],
  );

  const groupsCols: TableColumnsType<GroupsTableData> = useMemo(
    () => [
      {
        title: 'name',
        dataIndex: 'name',
        width: '3%',
        sorter: (a, b) => a.name.localeCompare(b.name),
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Permisison',
        width: '1%',
        render(_, record) {
          return (
            <Switch defaultChecked={record.permission} onChange={(newVal) => updateGroupPermissions(newVal, record)} />
          );
        },
      },
    ],
    [updateGroupPermissions],
  );

  const filteredGroupsTableData = useMemo(() => {
    const networkGroupsMap: Record<UserGroup, UserGroup> =
      network.prosettings?.allowedgroups.reduce((acc, g) => ({ ...acc, [g]: g }), {}) ?? {};

    const allGroupsData = groups.map((g) => ({ name: g, permission: networkGroupsMap[g] ? true : false }));
    if (shouldDisplayAllGroups) return allGroupsData;
    return allGroupsData.filter((g) => g.permission);
  }, [groups, network.prosettings?.allowedgroups, shouldDisplayAllGroups]);

  const usersCols: TableColumnsType<UserTableData> = useMemo(
    () => [
      {
        title: 'User Name',
        dataIndex: 'username',
        sorter: (a, b) => a.username.localeCompare(b.username),
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Groups',
        dataIndex: 'groups',
        render(_, user) {
          return user.groups?.join(', ');
        },
      },
      {
        title: 'Permisison',
        width: '1%',
        render(_, user) {
          return <Switch defaultChecked={user.permission} onChange={(newVal) => updateUserPermissions(newVal, user)} />;
        },
      },
    ],
    [updateUserPermissions],
  );

  const filteredUsersTableData = useMemo(() => {
    const networkUsersMap: Record<User['username'], User['username']> =
      network.prosettings?.allowedusers.reduce((acc, u) => ({ ...acc, [u]: u }), {}) ?? {};

    const allUsersData = users.map((u) => ({ ...u, permission: networkUsersMap[u.username] ? true : false }));
    if (shouldDisplayAllUsers) return allUsersData;
    return allUsersData.filter((u) => u.permission);
  }, [network.prosettings?.allowedusers, shouldDisplayAllUsers, users]);

  const getGroupsContent = useCallback(() => {
    return (
      <>
        <Row>
          <Col xs={18}>
            <Typography.Title style={{ marginTop: '0px' }} level={5}>
              Groups
            </Typography.Title>
          </Col>
          <Col xs={6} style={{ textAlign: 'right' }}>
            <Typography.Text style={{ marginRight: '1rem' }}>Display All</Typography.Text>
            <Switch checked={shouldDisplayAllGroups} onChange={(newVal) => setShouldDisplayAllGroups(newVal)} />
          </Col>
        </Row>

        <Row>
          <Col xs={24}>
            <Table columns={groupsCols} dataSource={filteredGroupsTableData} rowKey="name" />
          </Col>
        </Row>
      </>
    );
  }, [filteredGroupsTableData, groupsCols, shouldDisplayAllGroups]);

  const getUsersContent = useCallback(() => {
    return (
      <>
        <Row>
          <Col xs={18}>
            <Typography.Title style={{ marginTop: '0px' }} level={5}>
              Users
            </Typography.Title>
          </Col>
          <Col xs={6} style={{ textAlign: 'right' }}>
            <Typography.Text style={{ marginRight: '1rem' }}>Display All</Typography.Text>
            <Switch checked={shouldDisplayAllUsers} onChange={(newVal) => setShouldDisplayAllUsers(newVal)} />
          </Col>
        </Row>

        <Row>
          <Col xs={24}>
            <Table columns={usersCols} dataSource={filteredUsersTableData} rowKey="username" />
          </Col>
        </Row>
      </>
    );
  }, [usersCols, filteredUsersTableData, shouldDisplayAllUsers]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'groups',
        label: 'Groups',
        children: getGroupsContent(),
      },
      {
        key: 'users',
        label: 'Users',
        children: getUsersContent(),
      },
    ],
    [getGroupsContent, getUsersContent],
  );

  const updateDefaultAccessLevel = useCallback(
    async (newVal: ProSettings['defaultaccesslevel']) => {
      try {
        const networkPayload = convertUiNetworkToNetworkPayload(network);
        const newNetwork = (
          await NetworksService.updateNetwork(network.netid, {
            ...networkPayload,
            prosettings: { ...(networkPayload.prosettings ?? NULL_NETWORK_PROSETTINGS), defaultaccesslevel: newVal },
          })
        ).data;
        notify.success({ message: `Updated default access level to ${newVal}` });
        onUpdate(convertNetworkPayloadToUiNetwork(newNetwork));
      } catch (err) {
        notify.error({
          message: 'Failed to update network permissions',
          description: extractErrorMsg(err as any),
        });
      }
    },
    [network, notify, onUpdate],
  );

  const loadUserGroups = useCallback(async () => {
    try {
      const groups = await UsersService.getUserGroups();
      setGroups(groups);
    } catch (err) {
      notify.error({
        message: 'Failed to load user groups',
        description: extractErrorMsg(err as any),
      });
    }
  }, [notify]);

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
    loadUserGroups();
    loadUsers();
  }, [loadUserGroups, loadUsers]);

  return (
    <Modal
      title={
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Network permissions for {network.netid || ''}</span>
      }
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      // centered
      className="CustomModal"
      style={{ minWidth: '60vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Row>
          <Col xs={24} md={8}>
            <Typography.Text>Default Access Level</Typography.Text>
          </Col>
          <Col xs={24} md={16}>
            <Select
              defaultValue={network.prosettings?.defaultaccesslevel}
              options={accessLevels}
              onChange={updateDefaultAccessLevel}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Row>
          <Col xs={24}>
            <Tabs items={tabs} defaultActiveKey="groups" />
          </Col>
        </Row>
      </div>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
