import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { UserRole } from '@/models/User';
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
interface RolesPageProps {}

export default function RolesPage(props: RolesPageProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [userRoles, setUserRoles] = useState<UserRole[]>([
    { id: '1', name: 'Network User', type: 'network' },
    { id: '2', name: 'Network Admin', type: 'network' },
    { id: '3', name: 'User', type: 'platform' },
    { id: '4', name: 'Admin', type: 'platform' },
    { id: '5', name: 'Superadmin', type: 'platform' },
  ]);
  const [searchRoles, setSearchRoles] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const filteredRoles = useMemo(() => {
    return userRoles
      .filter((role) => {
        return role.name?.toLowerCase().includes(searchRoles.toLowerCase());
      })
      .sort((a, b) => a.name?.localeCompare(b.name ?? '') ?? 0);
  }, [searchRoles, userRoles]);

  const confirmDeleteRole = useCallback(
    (role: UserRole) => {
      Modal.confirm({
        title: 'Delete Role',
        content: `Are you sure you want to delete the role "${role.name}"? This will remove the role from all users/groups, and they will lose any associated permissions.`,
        onOk: () => {
          setUserRoles((roles) => roles.filter((r) => r.id !== role.id));
          setSelectedRole(null);
          notify.success({ message: `Role "${role.name}" deleted` });
        },
      });
    },
    [notify],
  );

  const roleTableColumns = useMemo<TableColumnProps<UserRole>[]>(
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
        title: 'Type',
        dataIndex: 'type',
      },
      {
        width: '1rem',
        align: 'end',
        render(_, role) {
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
                      setSelectedRole(role);
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
                      confirmDeleteRole(role);
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
    [confirmDeleteRole],
  );

  const isEmpty = userRoles.length === 0;
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
              User Roles
            </Typography.Title>
            <Typography.Text style={{ color: 'white ' }}>
              User roles are used to define the permissions and access levels of users within the platform. There are
              two main kinds of roles: platform roles and network roles. Platform roles define the permissions of users
              within the platform, so they are able to configure properties like enrollment keys and network-wide host
              settings. Network roles define the permissions of users within a specific network; permissions to features
              such as relays and remote access gateway can be configured with this.
            </Typography.Text>
          </Col>
          <Col xs={24} xl={(24 * 1) / 3} style={{ position: 'relative' }}>
            <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
              <Typography.Title level={3}>Create a role</Typography.Title>
              <Typography.Text>
                Define a platform or network role to configure the permissions of users within the platform.
                <br />
                <br />
                User roles will help control the access levels of users platform-wide or per network.
                <br />
                <br />
                Platform roles define the permissions of users within the platform (network-wide) whiles network roles
                define the permissions of users within a specific network.
              </Typography.Text>
              <Row style={{ marginTop: '1rem' }}>
                <Col>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'create-platform-role',
                          label: 'Create a Platform Role',
                          onClick: () => {},
                        },
                        {
                          key: 'create-network-role',
                          label: 'Create a Network Role',
                          onClick: () => {},
                        },
                      ],
                    }}
                  >
                    <Button type="primary" size="large" onClick={() => {}}>
                      <PlusOutlined /> Create Role
                    </Button>
                  </Dropdown>
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
                placeholder="Search roles"
                size="large"
                value={searchRoles}
                onChange={(ev) => setSearchRoles(ev.target.value.trim())}
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
              <Dropdown
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: 'create-platform-role',
                      label: 'Create a Platform Role',
                      onClick: () => {},
                    },
                    {
                      key: 'create-network-role',
                      label: 'Create a Network Role',
                      onClick: () => {},
                    },
                  ],
                }}
              >
                <Button type="primary" size="large" onClick={() => {}}>
                  <PlusOutlined /> Create Role
                </Button>
              </Dropdown>
            </Col>
          </Row>
          <Row style={{ width: '100%' }}>
            <Col xs={24}>
              <div className="table-wrapper">
                <Table
                  columns={roleTableColumns}
                  dataSource={filteredRoles}
                  rowKey="id"
                  size="small"
                  scroll={{ x: true }}
                  // rowClassName={(role) => {
                  //   return role.id === selectedRole?.id ? 'selected-row' : '';
                  // }}
                  onRow={(role) => {
                    return {
                      onClick: () => {
                        setSelectedRole(role);
                      },
                    };
                  }}
                  // rowSelection={{
                  //   type: 'radio',
                  //   hideSelectAll: true,
                  //   selectedRowKeys: selectedRole ? [selectedRole.id] : [],
                  //   onSelect: (role) => {
                  //     setSelectedRole(role);
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
