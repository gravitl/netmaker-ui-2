import { Host } from '@/models/Host';
import { AppRoutes } from '@/routes';
import { useStore } from '@/store/store';
import { getHostRoute, getNewHostRoute } from '@/utils/RouteUtils';
import { MoreOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Layout,
  MenuProps,
  Modal,
  notification,
  Row,
  Skeleton,
  Switch,
  Table,
  TableColumnsType,
  Tabs,
  TabsProps,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { PageProps } from '../../models/Page';
import './UsersPage.scss';
import { getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { Network } from '@/models/Network';
import { HostsService } from '@/services/HostsService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NetworksService } from '@/services/NetworksService';
import { UsersService } from '@/services/UsersService';
import { User } from '@/models/User';

export default function UsersPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const hosts = store.hosts;
  const storeUpdateHost = store.updateHost;
  const storeFetchHosts = useStore((state) => state.fetchHosts);
  const storeFetchNetworks = useStore((state) => state.fetchNetworks);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [isJoinNetworkModalOpen, setIsJoinNetworkModalOpen] = useState(false);

  const filteredNetworks = useMemo(() => {
    return store.networks;
  }, [store.networks]);

  const filteredHosts = useMemo(
    () =>
      hosts.filter((host) => {
        return host.name.toLowerCase().includes(searchText.toLowerCase());
      }),
    [hosts, searchText]
  );

  const confirmToggleHostDefaultness = useCallback(
    async (host: Host) => {
      Modal.confirm({
        title: 'Toggle defaultness',
        content: `Are you sure you want to turn ${!host.isdefault ? 'on' : 'off'} defaultness for this host?`,
        onOk: async () => {
          try {
            const newHost = (await HostsService.updateHost(host.id, { ...host, isdefault: !host.isdefault })).data;
            notify.success({ message: `Host ${host.id} updated` });
            storeUpdateHost(host.id, newHost);
          } catch (err) {
            notify.error({
              message: 'Failed to update host',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, storeUpdateHost]
  );

  const onEditHost = useCallback(
    (host: Host) => {
      navigate(getHostRoute(host, { edit: 'true' }));
    },
    [navigate]
  );

  const hostsTableColumns: TableColumnsType<Host> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (value, host) => <Link to={getHostRoute(host)}>{host.name}</Link>,
        sorter(a, b) {
          return a.name.localeCompare(b.name);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
      },
      {
        title: 'Public Port',
        dataIndex: 'listenport',
      },
      {
        title: 'Version',
        dataIndex: 'version',
      },
      {
        title: 'Proxy Status',
        dataIndex: 'proxy_enabled',
        render(value, host) {
          return <Switch checked={value} />;
        },
      },
      // {
      //   title: 'Relay status',
      //   render(_, host) {
      //     let relayer: Host | undefined;

      //     if (host.isrelayed) {
      //       relayer = hosts.find((h) => h.id === host.relayed_by);
      //     }

      //     return (
      //       <Space direction="horizontal">
      //         <Tag color={host.isrelay ? 'success' : 'default'}>Relay</Tag>
      //         <Tag
      //           color={host.isrelayed ? 'blue' : 'default'}
      //           title={host.isrelayed ? `Relayed by "${relayer?.name}"` : ''}
      //         >
      //           Relayed
      //         </Tag>
      //       </Space>
      //     );
      //   },
      // },
      {
        title: 'Health Status',
        render(_, host) {
          const nodeHealths = store.nodes
            .filter((n) => n.hostid === host.id)
            .map((n) => getNodeConnectivityStatus(n))
            .map((h) => {
              switch (h) {
                case 'healthy':
                  return 3;
                case 'warning':
                  return 2;
                case 'error':
                  return 1;
                default:
                  return 0;
              }
            })
            .filter((h) => h !== 0);

          let worstHealth = Number.MAX_SAFE_INTEGER;
          nodeHealths.forEach((h) => {
            worstHealth = Math.min(worstHealth, h);
          });

          switch (worstHealth) {
            default:
              return <Tag>Unknown</Tag>;
            case 1:
              return <Tag color="error">Error</Tag>;
            case 2:
              return <Tag color="warning">Warning</Tag>;
            case 3:
              return <Tag color="success">Healthy</Tag>;
          }
        },
      },
    ],
    [store.nodes]
  );

  const hostsTableCols2: TableColumnsType<Host> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (value, host) => <Link to={getHostRoute(host)}>{host.name}</Link>,
        sorter(a, b) {
          return a.name.localeCompare(b.name);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
      },
      {
        title: 'Public Port',
        dataIndex: 'listenport',
      },
      {
        width: '1rem',
        render(_, host) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'default',
                    label: (
                      <Typography.Text
                        onClick={(ev) => {
                          ev.stopPropagation();
                          confirmToggleHostDefaultness(host);
                        }}
                      >
                        {host.isdefault ? 'Unmake default' : 'Make default'}
                      </Typography.Text>
                    ),
                  },
                  {
                    key: 'edit',
                    label: (
                      <Typography.Text
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEditHost(host);
                        }}
                      >
                        Edit Host
                      </Typography.Text>
                    ),
                  },
                ] as MenuProps['items'],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [confirmToggleHostDefaultness, onEditHost]
  );

  const networksTableCols: TableColumnsType<Network> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'netid',
        sorter(a, b) {
          return a.netid.localeCompare(b.netid);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Address Range (IPv4)',
        dataIndex: 'addressrange',
      },
      {
        title: 'Address Range (IPv6)',
        dataIndex: 'addressrange6',
      },
    ],
    []
  );

  // ui components
  const getUsersContent = useCallback(() => {
    return (
      <Skeleton loading={!hasLoaded && store.isFetchingHosts} active title={true} className="page-padding">
        <Row className="">
          <Col xs={24}>
            <Table columns={hostsTableColumns} dataSource={filteredHosts} rowKey="id" />
          </Col>
        </Row>
      </Skeleton>
    );
  }, [filteredHosts, hasLoaded, store.isFetchingHosts, hostsTableColumns]);

  const getNetworkAccessContent = useCallback(() => {
    return (
      <Skeleton loading={!hasLoaded && store.isFetchingHosts} active title={true} className="page-padding">
        <>
          <Row className="" justify="space-between">
            <Col xs={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={24}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Hosts
                  </Typography.Title>
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <Table
                    columns={hostsTableCols2}
                    dataSource={filteredHosts}
                    rowKey="id"
                    size="small"
                    rowClassName={(host) => {
                      return host.id === selectedHost?.id ? 'selected-row' : '';
                    }}
                    onRow={(host) => {
                      return {
                        onClick: () => {
                          if (selectedHost?.id === host.id) setSelectedHost(null);
                          else setSelectedHost(host);
                        },
                      };
                    }}
                  />
                </Col>
              </Row>
            </Col>
            <Col xs={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Networks
                  </Typography.Title>
                </Col>
                <Col xs={12} style={{ textAlign: 'right' }}>
                  {selectedHost && (
                    <Button
                      type="primary"
                      style={{ marginRight: '1rem' }}
                      onClick={() => setIsJoinNetworkModalOpen(true)}
                    >
                      <PlusOutlined /> Join network
                    </Button>
                  )}
                  Display All{' '}
                  <Switch
                    title="Display all networks. Click a host to filter networks the host is connected to."
                    checked={selectedHost === null}
                    onClick={() => {
                      setSelectedHost(null);
                    }}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={24}>
                  <Table columns={networksTableCols} dataSource={filteredNetworks} rowKey="netid" size="small" />
                </Col>
              </Row>
            </Col>
          </Row>
        </>
      </Skeleton>
    );
  }, [
    hasLoaded,
    store.isFetchingHosts,
    hostsTableCols2,
    filteredHosts,
    selectedHost,
    networksTableCols,
    filteredNetworks,
  ]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'users',
        label: 'Users',
        children: getUsersContent(),
      },
      {
        key: 'network-permissions',
        label: 'Network Permissions',
        children: getNetworkAccessContent(),
      },
      {
        key: 'groups',
        label: 'Groups',
        children: getNetworkAccessContent(),
      },
    ],
    [getUsersContent, getNetworkAccessContent]
  );

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const users = (await UsersService.getUsers()).data;
      setUsers(users);
    } catch (err) {
      notify.error({
        message: 'Failed to load users',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <Layout.Content
      className="UsersPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active title={true} className="page-padding">
        {users.length === 0 && (
          <>
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <Col xs={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  Users
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque amet modi cum aut doloremque dicta
                  reiciendis odit molestias nam animi enim et molestiae consequatur quas quo facere magni, maiores rem.
                </Typography.Text>
              </Col>
              <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a User</Typography.Title>
                  <Typography.Text>Users access the Netmaker UI to configure their networks.</Typography.Text>
                  <Row style={{ marginTop: 'auto' }}>
                    <Col>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                          // TODO: create user
                        }}
                      >
                        <PlusOutlined /> Create a User
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: '8rem', padding: '0px 5.125rem' }} gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Add a User</Typography.Title>
              </Col>

              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Manage access to Netmaker
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Manage access to Netmaker
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Manage access to Netmaker
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
        {users.length > 0 && (
          <>
            <Row className="page-row-padding">
              <Col xs={24}>
                <Typography.Title level={3}>Users</Typography.Title>
              </Col>
            </Row>

            {/* <Row className="page-row-padding" justify="space-between">
              <Col xs={12} md={8}>
                <Input
                  size="large"
                  placeholder="Search hosts"
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
                />
              </Col>
              <Col xs={12} md={6} style={{ textAlign: 'right' }}>
                <Button type="primary" size="large" onClick={() => navigate(getNewHostRoute(AppRoutes.HOSTS_ROUTE))}>
                  <PlusOutlined /> Add a User
                </Button>
              </Col>
            </Row> */}

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24}>
                <Tabs defaultActiveKey="users" items={tabs} />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
