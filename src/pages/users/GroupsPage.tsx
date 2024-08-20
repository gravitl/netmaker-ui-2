import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { User, UserGroup } from '@/models/User';
import { AppRoutes } from '@/routes';
import { UsersService } from '@/services/UsersService';
import { getUserGroupRoute, resolveAppRoute } from '@/utils/RouteUtils';
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
interface GroupPageProps {
  users: User[];
  triggerDataRefresh?: () => void;
}

export default function GroupsPage({ users, triggerDataRefresh }: GroupPageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const navigate = useNavigate();
  const { isServerEE } = useServerLicense();

  const [isLoading, setIsLoading] = useState(true);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [searchGroups, setSearchGroup] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  const groupUsersCount = useMemo<Record<UserGroup['id'], number>>(() => {
    return users.reduce(
      (acc, user) => {
        Object.keys(user.user_group_ids ?? {}).forEach((group) => {
          acc[group] = (acc[group] ?? 0) + 1;
        });
        return acc;
      },
      {} as Record<UserGroup['id'], number>,
    );
  }, [users]);

  const filteredGroups = useMemo(() => {
    return userGroups
      .filter((role) => {
        return role.id?.toLowerCase().includes(searchGroups.trim().toLowerCase());
      })
      .sort((a, b) => a.id?.localeCompare(b.id ?? '') ?? 0);
  }, [searchGroups, userGroups]);

  const confirmDeleteGroup = useCallback(
    (group: UserGroup) => {
      Modal.confirm({
        title: 'Delete Group',
        content: `Are you sure you want to delete the group "${group.id}"? All users will be removed from the group and will lose any associated permissions.`,
        onOk: async () => {
          try {
            await UsersService.deleteGroup(group.id);
            setUserGroups((roles) => roles.filter((r) => r.id !== group.id));
            setSelectedGroup(null);
            notify.success({ message: `Group "${group.id}" successfully deleted` });
            triggerDataRefresh?.();
          } catch (error) {
            notify.error({ message: 'Failed to delete group' });
          }
        },
      });
    },
    [notify, triggerDataRefresh],
  );

  const groupTableColumns = useMemo<TableColumnProps<UserGroup>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'id',
        render(name) {
          return (
            <>
              <Typography.Link
                onClick={() => {
                  navigate(getUserGroupRoute(name));
                }}
              >
                {name}
              </Typography.Link>
            </>
          );
        },
        sorter: (a, b) => a.id?.localeCompare(b.id ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Member Count',
        render(_, group) {
          return <Typography.Text>{groupUsersCount[group.id] ?? 0}</Typography.Text>;
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
                  // {
                  //   key: 'update',
                  //   label: (
                  //     <Typography.Text>
                  //       <EditOutlined /> Update
                  //     </Typography.Text>
                  //   ),
                  //   onClick: (info) => {
                  //     setSelectedGroup(group);
                  //     info.domEvent.stopPropagation();
                  //   },
                  // },
                  {
                    key: 'delete',
                    danger: true,
                    label: (
                      <>
                        <DeleteOutlined /> Delete
                      </>
                    ),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                      confirmDeleteGroup(group);
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
    [confirmDeleteGroup, groupUsersCount, navigate],
  );

  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const groups = (await UsersService.getGroups()).data.Response;
      setUserGroups(groups);
    } catch (error) {
      notify.error({ message: 'Failed to load groups' });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (isServerEE) {
      loadGroups();
    }
  }, [isServerEE, loadGroups]);

  const isEmpty = userGroups.length === 0;
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
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      navigate(resolveAppRoute(AppRoutes.CREATE_GROUP_ROUTE));
                    }}
                  >
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
                onChange={(ev) => setSearchGroup(ev.target.value)}
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
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  navigate(resolveAppRoute(AppRoutes.CREATE_GROUP_ROUTE));
                }}
              >
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
    </Skeleton>
  );
}
