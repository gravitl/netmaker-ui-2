import { Host } from '@/models/Host';
import { AppRoutes } from '@/routes';
import { useStore } from '@/store/store';
import { getHostRoute, resolveAppRoute } from '@/utils/RouteUtils';
import {
  InfoCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
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
  Space,
  Switch,
  Table,
  TableColumnsType,
  Tabs,
  TabsProps,
  Tag,
  Tour,
  TourProps,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { PageProps } from '../../models/Page';
import './HostsPage.scss';
import { getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { Network } from '@/models/Network';
import { HostsService } from '@/services/HostsService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { isManagedHost } from '@/utils/Utils';
import NewHostModal from '@/components/modals/new-host-modal/NewHostModal';
import { lt } from 'semver';
import { ExtendedNode } from '@/models/Node';
import { HOST_HEALTH_STATUS } from '@/models/NodeConnectivityStatus';

const HOST_DOCS_URL = 'https://docs.netmaker.io/ui-reference.html#hosts';

export default function HostsPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const hosts = store.hosts;
  const storeUpdateHost = store.updateHost;
  const storeDeleteHost = store.deleteHost;
  const storeFetchHosts = useStore((state) => state.fetchHosts);
  const storeFetchNetworks = useStore((state) => state.fetchNetworks);
  const [searchText, setSearchText] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [hasAdvicedHosts, setHasAdvicedHosts] = useState(false);
  const [isRefreshingHosts, setIsRefreshingHosts] = useState(false);
  const [isAddNewHostModalOpen, setIsAddNewHostModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeKey, setActiveKey] = useState('overview');
  const [tourStep, setTourStep] = useState(0);
  const hostsTableRef = useRef(null);
  const networkAccessManagementTabRef = useRef(null);
  const networkAccessManagementTabHostsTableRef = useRef(null);
  const networkAccessManagementTabNetworksTableRef = useRef(null);
  const refreshHostKeysButtonRef = useRef(null);
  const connectHostButtonRef = useRef(null);
  const connectHostModalEnrollmentKeysTabRef = useRef(null);
  const connectHostModalSelectOSTabRef = useRef(null);
  const connectHostModalJoinNetworkTabRef = useRef(null);

  const checkIfUpgradeButtonShouldBeDisabled = useCallback(
    (host: Host) => {
      if (store.serverConfig?.Version === undefined) {
        return true;
      }

      if (lt(host.version, store.serverConfig?.Version)) {
        return false;
      }

      return true;
    },
    [store.serverConfig?.Version],
  );

  const filteredNetworks = useMemo(() => {
    return store.networks;
  }, [store.networks]);

  const filteredHosts = useMemo(
    () =>
      hosts.filter((host) => {
        return `${host.name ?? ''}${host.endpointip ?? ''}${host.endpointipv6 ?? ''}${host.publickey ?? ''}${host.id ?? ''}`
          .toLowerCase()
          .includes(searchText.toLowerCase());
      }),
    [hosts, searchText],
  );

  const refreshHostKeys = useCallback(
    (host: Host) => {
      Modal.confirm({
        title: 'Refresh host keys',
        content: `Are you sure you want to refresh this host's (${host.name}) keys?`,
        onOk: async () => {
          try {
            await HostsService.refreshHostKeys(host.id);
            notify.success({
              message: 'Host keys refreshing...',
              description: 'Host key pairs are refreshing. This may take a while.',
            });
          } catch (err) {
            notify.error({
              message: 'Failed to refresh host keys',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify],
  );

  const requestHostPull = useCallback(
    (host: Host) => {
      Modal.confirm({
        title: 'Synchronise host',
        content: `This will trigger the host (${host.name}) to pull latest network(s) state from the server. Proceed?`,
        onOk: async () => {
          try {
            await HostsService.requestHostPull(host.id);
            notify.success({
              message: 'Host is syncing...',
              description: `Host pull has been initiated for ${host.name}. This may take a while.`,
            });
          } catch (err) {
            notify.error({
              message: 'Failed to synchronise host',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify],
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
    [notify, storeUpdateHost],
  );

  const onEditHost = useCallback(
    (host: Host) => {
      navigate(getHostRoute(host, { edit: 'true' }));
    },
    [navigate],
  );

  const confirmDeleteHost = useCallback(
    async (host: Host) => {
      const assocNodes = store.nodes.filter((node) => node.hostid === host.id);

      Modal.confirm({
        title: 'Delete host',
        content: (
          <>
            <Row>
              <Col xs={24}>
                <Typography.Text>Are you sure you want to delete this host {host.name}?</Typography.Text>
              </Col>
              {assocNodes.length > 0 && (
                <Col xs={24}>
                  <Typography.Text color="warning">Host will be removed from the following networks:</Typography.Text>
                  <ul>
                    {assocNodes.map((node) => (
                      <li key={node.id}>{node.network}</li>
                    ))}
                  </ul>
                </Col>
              )}
            </Row>
          </>
        ),
        onOk: async () => {
          try {
            await HostsService.deleteHost(host.id, true);
            storeDeleteHost(host.id);
            notify.success({ message: `Host ${host.name} deleted` });
          } catch (err) {
            notify.error({
              message: 'Failed to delete host',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, store.nodes, storeDeleteHost],
  );

  const refreshAllHostKeys = useCallback(() => {
    Modal.confirm({
      title: 'Refresh all hosts keys',
      content: 'Are you sure you want to refresh all hosts keys?',
      onOk: async () => {
        try {
          setIsRefreshingHosts(true);
          await HostsService.refreshAllHostsKeys();
          notify.success({
            message: 'Hosts keys refreshing...',
            description: 'Host key pairs are refreshing. This may take a while.',
          });
        } catch (err) {
          notify.error({
            message: 'Failed to refresh hosts keys',
            description: extractErrorMsg(err as any),
          });
        } finally {
          setIsRefreshingHosts(false);
        }
      },
    });
  }, [notify]);

  const confirmUpgradeClient = useCallback(
    async (host: Host) => {
      Modal.confirm({
        title: 'Upgrade host version',
        content: (
          <>
            <Row>
              <Col xs={24}>
                <Typography.Text>
                  Are you sure you want to upgrade the version of the host {host.name} to {store.serverConfig?.Version}
                </Typography.Text>
              </Col>
            </Row>
          </>
        ),
        onOk: async () => {
          try {
            await HostsService.upgradeClientVersion(host.id);
            notify.success({ message: `The upgrade has been triggered and it may take a while` });
          } catch (err) {
            notify.error({
              message: 'Failed to upgrade client version',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, store.serverConfig?.Version],
  );

  const filterByHostHealthStatus = useCallback(
    (value: React.Key | boolean, record: Host): boolean => {
      // return false if value is boolean or undefined or number
      if (typeof value === 'boolean' || value === undefined || typeof value === 'number') {
        return false;
      }

      const node = store.nodes.find((n) => n.hostid === record.id);

      // return true if node is undefined and value is unknown
      if (!node && value === HOST_HEALTH_STATUS.unknown) {
        return true;
      }

      // return false if node is undefined and value is not unknown
      if (!node) {
        return false;
      }

      const nodeHealth = getNodeConnectivityStatus(node as ExtendedNode);
      return nodeHealth === value;
    },
    [store.nodes],
  );

  const hostsTableColumns: TableColumnsType<Host> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (_, host) => <Link to={getHostRoute(host)}>{host.name}</Link>,
        sorter(a, b) {
          return a.name.localeCompare(b.name);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Endpoint (IPv4)',
        dataIndex: 'endpointip',
        render: (endpointip) => (
          <div onClick={(ev) => ev.stopPropagation()}>
            <Typography.Text>{endpointip}</Typography.Text>
          </div>
        ),
      },
      {
        title: 'Endpoint (IPv6)',
        dataIndex: 'endpointipv6',
        render: (endpointipv6) => (
          <div onClick={(ev) => ev.stopPropagation()}>
            <Typography.Text>{endpointipv6}</Typography.Text>
          </div>
        ),
      },
      {
        title: 'Public Port',
        dataIndex: 'listenport',
        render: (listenport) => (
          <div onClick={(ev) => ev.stopPropagation()}>
            <Typography.Text>{listenport}</Typography.Text>
          </div>
        ),
      },
      {
        title: 'Version',
        dataIndex: 'version',
        render: (version) => (
          <div onClick={(ev) => ev.stopPropagation()}>
            <Typography.Text>{version}</Typography.Text>
          </div>
        ),
      },
      // {
      //   title: 'Relay status',
      //   render(_, host) {
      //     let relayer: Host | undefined;

      //     if (host.isrelayed) {
      //       relayer = hosts.find((h) => h.id === host.relayed_by);
      //     }

      //     return (
      //       <Space direction="horizontal" onClick={(ev) => ev.stopPropagation()}>
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
        filters: [
          {
            text: 'Healthy',
            value: HOST_HEALTH_STATUS.healthy,
          },
          {
            text: 'Warning',
            value: HOST_HEALTH_STATUS.warning,
          },
          {
            text: 'Error',
            value: HOST_HEALTH_STATUS.error,
          },
          {
            text: 'Unknown',
            value: HOST_HEALTH_STATUS.unknown,
          },
        ],
        onFilter: (value: React.Key | boolean, record: any) => filterByHostHealthStatus(value, record),
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
      {
        title: '',
        width: '5rem',
        render: (_, host) => (
          <div onClick={(ev) => ev.stopPropagation()}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => {
                requestHostPull(host);
              }}
            >
              Sync
            </Button>
          </div>
        ),
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
                    label: host.isdefault ? 'Unmake default' : 'Make default',
                    onClick: (ev) => {
                      ev.domEvent.stopPropagation();
                      confirmToggleHostDefaultness(host);
                    },
                  },
                  {
                    key: 'refresh',
                    label: 'Refresh Host Keys',
                    onClick: (ev) => {
                      ev.domEvent.stopPropagation();
                      refreshHostKeys(host);
                    },
                  },
                  {
                    key: 'edit',
                    label: 'Edit Host',
                    disabled: isManagedHost(host.name),
                    tooltip: isManagedHost(host.name) ? 'Managed hosts cannot be edited' : undefined,
                    onClick: (ev) => {
                      ev.domEvent.stopPropagation();
                      onEditHost(host);
                    },
                  },
                  {
                    key: 'upgrade',
                    label: 'Upgrade Version',
                    disabled: checkIfUpgradeButtonShouldBeDisabled(host),
                    onClick: (ev) => {
                      ev.domEvent.stopPropagation();
                      confirmUpgradeClient(host);
                    },
                  },
                  {
                    key: 'delete',
                    label: 'Delete Host',
                    danger: true,
                    disabled: isManagedHost(host.name),
                    tooltip: isManagedHost(host.name) ? 'Managed hosts cannot be deleted' : undefined,
                    onClick: (ev) => {
                      ev.domEvent.stopPropagation();
                      confirmDeleteHost(host);
                    },
                  },
                ] as MenuProps['items'],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} onClick={(ev) => ev.stopPropagation()} />
            </Dropdown>
          );
        },
      },
    ],
    [
      filterByHostHealthStatus,
      store.nodes,
      requestHostPull,
      checkIfUpgradeButtonShouldBeDisabled,
      confirmToggleHostDefaultness,
      refreshHostKeys,
      onEditHost,
      confirmUpgradeClient,
      confirmDeleteHost,
    ],
  );

  const namHostsTableCols: TableColumnsType<Host> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        sorter(a, b) {
          return a.name.localeCompare(b.name);
        },
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Endpoint',
        render(_, host) {
          return (
            <Typography.Text>
              {([] as Array<string>).concat(host.endpointip, host.endpointipv6).filter(Boolean).join(', ')}
            </Typography.Text>
          );
        },
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
    [confirmToggleHostDefaultness, onEditHost],
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
      selectedHost
        ? {
            title: 'Host Network IP',
            dataIndex: 'addressrange',
            key: 'hostnetworkip',
            render: (_: any, network: Network) => {
              const node = store.nodes.find(
                (node) => node.network === network.netid && node.hostid === selectedHost.id,
              );
              return node ? (
                <div onClick={(ev) => ev.stopPropagation()}>
                  <Space direction="vertical" size={0}>
                    {node.address && <Typography.Text>{node.address?.split('/')[0] ?? ''}</Typography.Text>}
                    {node.address6 && <Typography.Text>{node.address6?.split('/')[0] ?? ''}</Typography.Text>}
                  </Space>
                </div>
              ) : (
                <div onClick={(ev) => ev.stopPropagation()}>
                  <Space direction="vertical" size={0}>
                    <Typography.Text type="secondary">Not connected</Typography.Text>
                  </Space>
                </div>
              );
            },
          }
        : {},
      {
        title: 'Address Range',
        dataIndex: 'addressrange',
        key: 'addressrange',
        render: (adress: string, network: Network) => (
          <div onClick={(ev) => ev.stopPropagation()}>
            <Space direction="vertical" size={0}>
              {network.addressrange && <Typography.Text>{network.addressrange}</Typography.Text>}
              {network.addressrange6 && <Typography.Text>{network.addressrange6}</Typography.Text>}
            </Space>
          </div>
        ),
      },
      selectedHost
        ? {
            title: 'Connection Status',
            render(_: any, network: Network) {
              const isConnected = store.nodes.some(
                (node) => node.network === network.netid && node.hostid === selectedHost.id,
              );
              return (
                <Switch
                  key={selectedHost.id}
                  checked={isConnected}
                  onChange={() => {
                    Modal.confirm({
                      title: `${isConnected ? 'Disconnect' : 'Connect'} host ${selectedHost.name} ${
                        isConnected ? 'from' : 'to'
                      } ${network.netid}`,
                      async onOk() {
                        try {
                          await HostsService.updateHostsNetworks(
                            selectedHost.id,
                            network.netid,
                            isConnected ? 'leave' : 'join',
                          );
                          notify.success({
                            message: `Host successfully ${
                              isConnected ? 'removed from' : 'added to'
                            } network. It might take a while to reflect`,
                            description: '',
                          });
                        } catch (err) {
                          notify.error({
                            message: `Failed to ${isConnected ? 'remove' : 'add'} host ${
                              isConnected ? 'from' : 'to'
                            } network`,
                          });
                        }
                      },
                    });
                  }}
                />
              );
            },
          }
        : {},
    ],
    [notify, selectedHost, store.nodes],
  );

  // ui components
  const getOverviewContent = useCallback(() => {
    return (
      <Skeleton loading={!hasLoaded && store.isFetchingHosts} active title={true} className="page-padding">
        <Row className="">
          <Col xs={24}>
            <div className="table-wrapper">
              <Table
                columns={hostsTableColumns}
                dataSource={filteredHosts}
                rowKey="id"
                scroll={{ x: true }}
                onRow={(host) => ({
                  onClick: () => {
                    navigate(getHostRoute(host));
                  },
                })}
                ref={hostsTableRef}
              />
            </div>
          </Col>
        </Row>
      </Skeleton>
    );
  }, [filteredHosts, hasLoaded, store.isFetchingHosts, hostsTableColumns, navigate]);

  const getNetworkAccessContent = useCallback(() => {
    return (
      <Skeleton loading={!hasLoaded && store.isFetchingHosts} active title={true} className="page-padding">
        <>
          <Row className="" justify="space-between">
            <Col xs={24} md={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={24}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Hosts
                  </Typography.Title>
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <div className="table-wrapper">
                    <Table
                      columns={namHostsTableCols}
                      dataSource={filteredHosts}
                      rowKey="id"
                      size="small"
                      scroll={{ x: true }}
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
                      ref={networkAccessManagementTabHostsTableRef}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
            <Col xs={24} md={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Networks
                  </Typography.Title>
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={24}>
                  <div className="table-wrapper">
                    <Table
                      columns={networksTableCols}
                      dataSource={filteredNetworks}
                      scroll={{ x: true }}
                      rowKey="netid"
                      size="small"
                      ref={networkAccessManagementTabNetworksTableRef}
                    />
                  </div>
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
    namHostsTableCols,
    filteredHosts,
    selectedHost,
    networksTableCols,
    filteredNetworks,
  ]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'overview',
        label: 'Overview',
        children: getOverviewContent(),
      },
      {
        key: 'network-access',
        label: 'Network Access Management',
        children: getNetworkAccessContent(),
      },
    ],
    [getOverviewContent, getNetworkAccessContent],
  );

  const fetchHostsAndNetworks = async () => {
    await storeFetchHosts();
    await storeFetchNetworks();
    setHasLoaded(true);
  };

  const hostsTourSteps: TourProps['steps'] = [
    {
      title: 'Hosts',
      description: (
        <>
          Hosts are your devices. Servers, devices, VM&quot;s, containers, laptops, and more can all be Hosts. You can
          get information about your hosts on the table. Clicking on the host name will show extra host details. The
          ellipsis button at the end of row shows additional operations such as making a host the default , editing its
          settings, upgrading its version, deleting the host
        </>
      ),
      target: () => hostsTableRef.current,
    },
    {
      title: 'Network Access Management',
      description:
        'You can view the networks that the host is connected to and connect or disconnect the host from a network.',
      target: () => networkAccessManagementTabRef.current,
    },
    {
      title: 'Network Access Manangement - Hosts',
      description: (
        <>
          You can view host information and once you select a host, you can view the networks that the host is connected
          to and connect or disconnect the host from a network on the right side, On the end of the row you can click
          the ellipsis button to make the host the default, edit its settings
        </>
      ),
      target: () => networkAccessManagementTabHostsTableRef.current,
    },
    {
      title: 'Network Access Manangement - Networks',
      description: <>You can view a network and it&quot;s address range</>,
      target: () => networkAccessManagementTabNetworksTableRef.current,
    },
    {
      title: 'Refresh Host Keys',
      description: 'Refresh all hosts keys',
      target: () => refreshHostKeysButtonRef.current,
    },
    {
      title: 'Connect a Host',
      description: 'You can connect a host by clicking on the button',
      target: () => connectHostButtonRef.current,
    },
    {
      title: 'Connect a Host - Enrollment Keys',
      description: (
        <>
          You can create an enrollment key which defines the networks a host has access to or you can pick an existing
          enrollment key
        </>
      ),
      target: () => connectHostModalEnrollmentKeysTabRef.current,
    },
    {
      title: 'Connect a Host - Select OS',
      description: (
        <>You can select the OS of the host that you want to connect and follow the netclient install instructions</>
      ),
      target: () => connectHostModalSelectOSTabRef.current,
    },
    {
      title: 'Connect a Host - Join a Network',
      description: <>You can join a network by running the command on the terminal</>,
      target: () => connectHostModalJoinNetworkTabRef.current,
    },
  ];

  const handleTourOnChange = (current: number) => {
    setTourStep(current);
    switch (current) {
      case 1:
        setActiveKey('network-access');
        break;
      case 0:
        setActiveKey('overview');
        break;
      case 5:
        setIsAddNewHostModalOpen(false);
        break;
      case 6:
        setIsAddNewHostModalOpen(true);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchHostsAndNetworks();
  }, [storeFetchHosts, storeFetchNetworks]);

  useEffect(() => {
    if (hosts.length <= 1 && !hasAdvicedHosts) {
      setHasAdvicedHosts(true);
      notify.info({
        message: t('info.connectmultiplehosts'),
        description: t('info.connectatleasttwohostsonanetworktobegincommunication'),
        duration: 10,
        btn: (
          <>
            <Button type="primary" size="small" onClick={() => setIsAddNewHostModalOpen(true)}>
              {t('hosts.connectahost')}
            </Button>
          </>
        ),
      });
    }
  }, [hasAdvicedHosts, hosts.length, notify, t]);

  return (
    <Layout.Content
      className="HostsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={!hasLoaded && store.isFetchingHosts} active title={true} className="page-padding">
        {hosts.length === 0 && (
          <>
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <Col xs={24} xl={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  Hosts
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  Hosts are your devices. Servers, devices, VM&apos;s, containers, laptops, and more can all be Hosts.
                  Windows, Linux, Mac, and FreeBSD are all supported. Register a Host with your server and add them to
                  networks to give them secure access to other hosts and resources.
                </Typography.Text>
              </Col>
              <Col xs={24} xl={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a Host</Typography.Title>
                  <Typography.Text>
                    Start creating your network by adding controllable devices as “hosts” on your platform. Servers,
                    VM’s, your laptop, and more are all fair game.
                  </Typography.Text>
                  <Row style={{ marginTop: 'auto' }}>
                    <Col>
                      <Button type="primary" size="large" onClick={() => setIsAddNewHostModalOpen(true)}>
                        <PlusOutlined /> Connect a Host
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Row
              className="card-con"
              style={{ marginTop: '8rem', marginBottom: '4rem', padding: '0px 5.125rem' }}
              gutter={[0, 20]}
            >
              <Col xs={24}>
                <Typography.Title level={3}>Connect a Host</Typography.Title>
              </Col>

              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Connect via Enrollment Keys
                  </Typography.Title>
                  <Typography.Text>
                    Create an enrollment key which defines the networks a host has access to. Then join via cli{' '}
                    <code>netclient join -t &lt;enrollment key&gt;</code> or the netclient GUI, and the host will join
                    all of the defined networks.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Connect via user auth
                  </Typography.Title>
                  <Typography.Text>
                    If you are an authorized user on the system, you can join a network directly using either basic auth
                    or sso. <code>netclient join -s &lt;server&gt; -n &lt;network&gt; [-u &lt;user&gt;]</code>
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} xl={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Add host directly
                  </Typography.Title>
                  <Typography.Text>
                    If a host is already registered with the server, you can add it into any network directly from the
                    dashboard. Simply go to Network Access Management tab under the{' '}
                    <Link to={resolveAppRoute(AppRoutes.HOSTS_ROUTE)}>Hosts page</Link>.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
        {hosts.length > 0 && (
          <>
            <Row className="page-row-padding">
              <Col xs={24}>
                <Typography.Title level={3}>Hosts</Typography.Title>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24} md={6}>
                <Input
                  size="large"
                  placeholder="Search hosts"
                  style={{ marginBottom: '0.5rem' }}
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={24} md={16} className="hosts-table-button" style={{ textAlign: 'right' }}>
                <Button
                  size="large"
                  style={{ marginRight: '1rem', marginBottom: '0.5rem' }}
                  onClick={() => {
                    setActiveKey('overview');
                    setTourStep(0);
                    setIsTourOpen(true);
                  }}
                >
                  <InfoCircleOutlined /> Start Tour
                </Button>
                <Button
                  size="large"
                  style={{ marginRight: '1rem', marginBottom: '0.5rem' }}
                  onClick={() => {
                    setHasLoaded(false);
                    fetchHostsAndNetworks();
                  }}
                >
                  <ReloadOutlined /> Reload
                </Button>
                <Button
                  size="large"
                  style={{ marginRight: '1rem', marginBottom: '0.5rem' }}
                  onClick={() => refreshAllHostKeys()}
                  loading={isRefreshingHosts}
                  ref={refreshHostKeysButtonRef}
                >
                  <ReloadOutlined /> Refresh Hosts Keys
                </Button>

                <Button
                  type="primary"
                  size="large"
                  style={{ marginRight: '1rem', marginBottom: '0.5rem' }}
                  onClick={() => setIsAddNewHostModalOpen(true)}
                  ref={connectHostButtonRef}
                >
                  <PlusOutlined /> Connect a host
                </Button>

                <Button
                  title="Go to Hosts documentation"
                  size="large"
                  href={HOST_DOCS_URL}
                  target="_blank"
                  icon={<QuestionCircleOutlined />}
                />
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24}>
                <Tabs
                  activeKey={activeKey}
                  items={tabs}
                  onChange={(activeKey: string) => {
                    setActiveKey(activeKey);
                  }}
                />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* tour */}
      <Tour
        open={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        steps={hostsTourSteps}
        onChange={handleTourOnChange}
      />

      {/* misc */}
      {notifyCtx}
      <NewHostModal
        isOpen={isAddNewHostModalOpen}
        onFinish={() => {
          setIsAddNewHostModalOpen(false);
          navigate(resolveAppRoute(AppRoutes.HOSTS_ROUTE));
        }}
        onCancel={() => setIsAddNewHostModalOpen(false)}
        connectHostModalEnrollmentKeysTabRef={connectHostModalEnrollmentKeysTabRef}
        connectHostModalSelectOSTabRef={connectHostModalSelectOSTabRef}
        connectHostModalJoinNetworkTabRef={connectHostModalJoinNetworkTabRef}
        isTourOpen={isTourOpen}
        tourStep={tourStep}
        page="host"
      />
    </Layout.Content>
  );
}
