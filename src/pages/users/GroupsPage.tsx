import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { UserGroup, UserRole } from '@/models/User';
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Modal,
  Row,
  Table,
  TableColumnProps,
  Typography,
  notification,
} from 'antd';
import { useCallback, useMemo, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface GroupPageProps {}

export default function GroupsPage(props: GroupPageProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [userGroups, setUserGroups] = useState<UserGroup[]>([
    { id: '1', name: 'all', networkRoles: [], members: ['aceix', 'kwesi@netmaker.io', 'philip@netmaker.io'] },
    { id: '2', name: 'Remote Workers', networkRoles: [], members: [] },
    { id: '5', name: 'Group 2', networkRoles: [], members: [] },
  ]);
  const [searchGroups, setSearchGroup] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  const filteredGroups = useMemo(() => {
    return userGroups
      .filter((role) => {
        return role.name?.toLowerCase().includes(searchGroups.toLowerCase());
      })
      .sort((a, b) => a.name?.localeCompare(b.name ?? '') ?? 0);
  }, [searchGroups, userGroups]);

  const confirmDeleteGroup = useCallback(
    (group: UserGroup) => {
      Modal.confirm({
        title: 'Delete Group',
        content: `Are you sure you want to delete the group "${group.name}"? All users will be removed from the group and will lose any associated permissions.`,
        onOk: () => {
          setUserGroups((roles) => roles.filter((r) => r.id !== group.id));
          setSelectedGroup(null);
          notify.success({ message: `Group "${group.name}" deleted` });
        },
      });
    },
    [notify],
  );

  const groupTableColumns = useMemo<TableColumnProps<UserGroup>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render(name) {
          return (
            <>
              <Typography.Link>{name}</Typography.Link>
            </>
          );
        },
        sorter: (a, b) => a.name?.localeCompare(b.name ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Member Count',
        render(_, group) {
          return <Typography.Text>{group.members?.length ?? 0}</Typography.Text>;
        },
      },
      {
        width: '1rem',
        align: 'end',
        render(_, group) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'update',
                    label: (
                      <Typography.Text>
                        <EditOutlined /> Update
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      setSelectedGroup(group);
                      info.domEvent.stopPropagation();
                    },
                  },
                  {
                    key: 'delete',
                    danger: true,
                    label: (
                      <>
                        <DeleteOutlined /> Delete
                      </>
                    ),
                    onClick: (info) => {
                      confirmDeleteGroup(group);
                      info.domEvent.stopPropagation();
                    },
                  },
                ],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [confirmDeleteGroup],
  );

  const isEmpty = userGroups.length === 0;
  return (
    <div className="" style={{ width: '100%' }}>
      {isEmpty && (
        <Row
          className="page-padding"
          style={{
            background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
            width: '100%',
          }}
        >
          <Col xs={24} xl={(24 * 2) / 3}>
            <Typography.Title level={3} style={{ color: 'white ' }}>
              User Groups
            </Typography.Title>
            <Typography.Text style={{ color: 'white ' }}>
              User groups are used to group users together for easier management. Users can be assigned to groups to
              inherit the permissions of the group. A group is basically a collection of network roles. Members of a
              group will inherit the permissions of the network roles assigned to the group. A user can only have their
              own custom permission set or the permissions set of a group they belong to, but not both.
            </Typography.Text>
          </Col>
          <Col xs={24} xl={(24 * 1) / 3} style={{ position: 'relative' }}>
            <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
              <Typography.Title level={3}>Create a group</Typography.Title>
              <Typography.Text>
                Begin creating a group to cluster users and manage them easily.
                <br />
                <br />
                User groups allow a collection of users to inherit the permissions of the group.
              </Typography.Text>
              <Row style={{ marginTop: '1rem' }}>
                <Col>
                  <Button type="primary" size="large" onClick={() => {}}>
                    <PlusOutlined /> Create Group
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
      {!isEmpty && (
        <>
          <Row style={{ width: '100%', marginBottom: '2rem' }}>
            <Col xs={24} md={12}>
              <Input
                placeholder="Search group"
                size="large"
                value={searchGroups}
                onChange={(ev) => setSearchGroup(ev.target.value.trim())}
                prefix={<SearchOutlined />}
                style={{ width: '60%' }}
                allowClear
              />
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Button
                title="Go to user management documentation"
                size="large"
                style={{ marginRight: '1rem' }}
                href={ExternalLinks.USER_MGMT_DOCS_URL}
                target="_blank"
                referrerPolicy="no-referrer"
                icon={<QuestionCircleOutlined />}
              />
              <Button type="primary" size="large" onClick={() => {}}>
                <PlusOutlined /> Create Group
              </Button>
            </Col>
          </Row>
          <Row style={{ width: '100%' }}>
            <Col xs={24}>
              <div className="table-wrapper">
                <Table
                  columns={groupTableColumns}
                  dataSource={filteredGroups}
                  rowKey="id"
                  size="small"
                  scroll={{ x: true }}
                  // rowClassName={(role) => {
                  //   return role.id === selectedRole?.id ? 'selected-row' : '';
                  // }}
                  onRow={(role) => {
                    return {
                      onClick: () => {
                        setSelectedGroup(role);
                      },
                    };
                  }}
                  // rowSelection={{
                  //   type: 'radio',
                  //   hideSelectAll: true,
                  //   selectedRowKeys: selectedGroup ? [selectedGroup.id] : [],
                  //   onSelect: (group) => {
                  //     setSelectedGroup(group);
                  //   },
                  // }}
                />
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* misc */}
      {notifyCtx}
    </div>
  );
}
