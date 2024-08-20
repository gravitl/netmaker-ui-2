import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { UserRole } from '@/models/User';
import { AppRoutes } from '@/routes';
import { UsersService } from '@/services/UsersService';
import { getNetworkRoleRoute, getPlatformRoleRoute, resolveAppRoute } from '@/utils/RouteUtils';
import { deriveUserRoleType } from '@/utils/UserMgmtUtils';
import { useServerLicense } from '@/utils/Utils';
import { DeleteOutlined, MoreOutlined, PlusOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Modal,
  Row,
  Skeleton,
  Table,
  TableColumnProps,
  Typography,
  notification,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RolesPageProps {
  triggerDataRefresh?: () => void;
}

export default function RolesPage({ triggerDataRefresh }: RolesPageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const navigate = useNavigate();
  const { isServerEE } = useServerLicense();

  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchRoles, setSearchRoles] = useState('');

  const filteredRoles = useMemo(() => {
    return userRoles
      .filter((role) => {
        return role.id?.toLowerCase().includes(searchRoles.trim().toLowerCase());
      })
      .sort((a, b) => a.id?.localeCompare(b.id ?? '') ?? 0);
  }, [searchRoles, userRoles]);

  const confirmDeleteRole = useCallback(
    (role: UserRole) => {
      Modal.confirm({
        title: 'Delete Role',
        content: `Are you sure you want to delete the role "${role.id}"? This will remove the role from all users/groups, and they will lose any associated permissions.`,
        onOk: async () => {
          try {
            await UsersService.deleteRole(role.id);
            setUserRoles((roles) => roles.filter((r) => r.id !== role.id));
            notify.success({ message: `Role "${role.id}" deleted` });
            triggerDataRefresh?.();
          } catch (error) {
            notify.error({ message: `Failed to delete role "${role.id}"` });
          }
        },
      });
    },
    [notify, triggerDataRefresh],
  );

  const roleTableColumns = useMemo<TableColumnProps<UserRole>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'id',
        render(_, role) {
          return (
            <>
              <Typography.Link>{role.ui_name || role.id}</Typography.Link>
            </>
          );
        },
        sorter: (a, b) => a.id?.localeCompare(b.id ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Network',
        dataIndex: 'network_id',
        render(networkId) {
          return <Typography.Text>{networkId}</Typography.Text>;
        },
        filters: [...new Set([...userRoles.map((r) => r.network_id)])].map((networkId) => ({
          key: networkId,
          text: networkId,
          value: networkId,
        })),
        filterSearch: true,
        onFilter: (value, record) => record.network_id === value,
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
                  // {
                  //   key: 'update',
                  //   disabled: role.default || deriveUserRoleType(role) === 'platform-role',
                  //   label: (
                  //     <Typography.Text
                  //       disabled={role.default}
                  //       title={role.default ? 'Cannot delete a defaul role' : ''}
                  //       onClick={(ev) => {
                  //         ev.stopPropagation();
                  //         if (deriveUserRoleType(role) === 'platform-role') return;
                  //         navigate(getNetworkRoleRoute(role));
                  //       }}
                  //     >
                  //       <EditOutlined /> Update
                  //     </Typography.Text>
                  //   ),
                  //   onClick: (info) => {
                  //     if (role.default) return;
                  //     setSelectedRole(role);
                  //     info.domEvent.stopPropagation();
                  //   },
                  // },
                  {
                    key: 'delete',
                    danger: true,
                    label: (
                      <span>
                        <DeleteOutlined /> Delete
                      </span>
                    ),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                      confirmDeleteRole(role);
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
    [confirmDeleteRole, userRoles],
  );

  const loadRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const roles = (await UsersService.getRoles()).data.Response;
      setUserRoles(roles);
    } catch (error) {
      notify.error({ message: 'Failed to load roles' });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (isServerEE) {
      loadRoles();
    }
  }, [isServerEE, loadRoles]);

  const isEmpty = userRoles.length === 0;
  return (
    <Skeleton loading={isLoading} active className="" style={{ width: '100%' }}>
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
              two main kinds of roles: platform access levels and network roles. Platform access levels define the
              permissions of users within the platform, so they are able to configure properties like enrollment keys
              and network-wide host settings. Network roles define the permissions of users within a specific network;
              permissions to features such as relays and remote access gateway can be configured with this.
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
                Platform access levels define the permissions of users within the platform (network-wide) whiles network
                roles define the permissions of users within a specific network.
              </Typography.Text>
              <Row style={{ marginTop: '1rem' }}>
                <Col>
                  {/* <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'create-platform-role',
                          label: 'Create a Platform Access Level',
                          onClick: () => {},
                        },
                        {
                          key: 'create-network-role',
                          label: <Typography.Text>Create a Network Role</Typography.Text>,
                          onClick: () => {
                            navigate(resolveAppRoute(AppRoutes.CREATE_NETWORK_ROLE_ROUTE));
                          },
                        },
                      ],
                    }}
                  >
                    <Button type="primary" size="large" onClick={() => {}}>
                      <PlusOutlined /> Create Role
                    </Button>
                  </Dropdown> */}
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      navigate(resolveAppRoute(AppRoutes.CREATE_NETWORK_ROLE_ROUTE));
                    }}
                  >
                    <PlusOutlined /> Create Network Role
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
                placeholder="Search roles"
                size="large"
                value={searchRoles}
                onChange={(ev) => setSearchRoles(ev.target.value)}
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
              {/* <Dropdown
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: 'create-platform-role',
                      label: 'Create a Platform Access Level',
                      onClick: () => {},
                    },
                    {
                      key: 'create-network-role',
                      label: 'Create a Network Role',
                      onClick: () => {
                        navigate(resolveAppRoute(AppRoutes.CREATE_NETWORK_ROLE_ROUTE));
                      },
                    },
                  ],
                }}
              >
                <Button type="primary" size="large" onClick={() => {}}>
                  <PlusOutlined /> Create Role
                </Button>
              </Dropdown> */}
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  navigate(resolveAppRoute(AppRoutes.CREATE_NETWORK_ROLE_ROUTE));
                }}
              >
                <PlusOutlined /> Create Network Role
              </Button>
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
                  pagination={{ hideOnSinglePage: true, defaultPageSize: 15 }}
                  // rowClassName={(role) => {
                  //   return role.id === selectedRole?.id ? 'selected-row' : '';
                  // }}
                  onRow={(role) => {
                    return {
                      onClick: (ev) => {
                        ev.stopPropagation();
                        if (deriveUserRoleType(role) === 'platform-role') {
                          navigate(getPlatformRoleRoute(role));
                          return;
                        }
                        navigate(getNetworkRoleRoute(role));
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
    </Skeleton>
  );
}
