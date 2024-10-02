import AddHostsToNetworkModal from '@/components/modals/add-hosts-to-network-modal/AddHostsToNetworkModal';
import NewHostModal from '@/components/modals/new-host-modal/NewHostModal';
import SetNetworkFailoverModal from '@/components/modals/set-network-failover-modal/SetNetworkFailoverModal';
import UpdateNodeModal from '@/components/modals/update-node-modal/UpdateNodeModal';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { ExtendedNode, Node } from '@/models/Node';
import { HOST_HEALTH_STATUS } from '@/models/NodeConnectivityStatus';
import { isSaasBuild } from '@/services/BaseService';
import { HostsService } from '@/services/HostsService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { getNetworkHostRoute } from '@/utils/RouteUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { getHostHealth, isManagedHost, useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  DownOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Waypoints } from 'lucide-react';
import { Key, useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

interface NetworkNodesPageProps {
  networkId?: string;
  isFullScreen: boolean;
}

export default function NetworkNodesPage({ isFullScreen }: NetworkNodesPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const storeDeleteNode = store.deleteNode;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();

  const [searchHost, setSearchHost] = useState('');
  const [isAddNewHostModalOpen, setIsAddNewHostModalOpen] = useState(false);
  const [isAddHostsToNetworkModalOpen, setIsAddHostsToNetworkModalOpen] = useState(false);
  const [isSetNetworkFailoverModalOpen, setIsSetNetworkFailoverModalOpen] = useState(false);
  const [targetNode, setTargetNode] = useState<Node | null>(null);
  const [isUpdateNodeModalOpen, setIsUpdateNodeModalOpen] = useState(false);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
  );

  const filteredNetworkNodes = useMemo<ExtendedNode[]>(
    () =>
      networkNodes.filter((node) =>
        `${node?.name ?? ''}${node.address ?? ''}${node.address6 ?? ''}${node.id ?? ''}${node.endpointip ?? ''}${node.publickey ?? ''}`
          .toLowerCase()
          .includes(searchHost.toLowerCase()),
      ),
    [searchHost, networkNodes],
  );

  const isFailoverNodePresentInNetwork = useMemo(() => {
    return networkNodes.some((node) => node.is_fail_over);
  }, [networkNodes]);

  const isManagedHostIsLoading = useMemo(() => {
    // check if managed host is loading
    const isNewTenant = store.isNewTenant;
    const isManagedHostLoaded = store.hosts.some((host) => isManagedHost(host.name));
    return isSaasBuild && isNewTenant && !isManagedHostLoaded;
  }, [store.isNewTenant, store.hosts]);

  const editNode = useCallback((node: Node) => {
    setTargetNode(node);
    setIsUpdateNodeModalOpen(true);
  }, []);

  const filterByHostHealthStatus = useCallback((value: Key | boolean, record: Node): boolean => {
    // return false if value is boolean or undefined or number
    if (typeof value === 'boolean' || value === undefined || typeof value === 'number') {
      return false;
    }

    // return true if node is undefined and value is unknown
    if (!record && value === HOST_HEALTH_STATUS.unknown) {
      return true;
    }

    const nodeHealth = getNodeConnectivityStatus(record as ExtendedNode);
    return nodeHealth === value;
  }, []);

  const confirmNodeFailoverStatusChange = useCallback(
    (node: ExtendedNode, makeFailover: boolean) => {
      let title = `Set ${node.name} as the failover host`;
      let content = `Are you sure you want to make this host the network failover host (and override the current)? Setting this will route traffic through this host in case of failure.`;

      if (!makeFailover) {
        title = `Unset ${node.name} as failover host`;
        content = `Are you sure you want to removing the failover status from this host?`;
      }

      Modal.confirm({
        title: title,
        content: content,
        okText: 'Yes',
        cancelText: 'No',
        onOk: async () => {
          try {
            if (makeFailover) {
              // remove current failover
              const currentFailoverNode = networkNodes.find((n) => n.is_fail_over);
              if (currentFailoverNode) {
                await NodesService.removeNodeFailoverStatus(currentFailoverNode.id);
              }
              await NodesService.setNodeAsFailover(node.id);
            } else {
              await NodesService.removeNodeFailoverStatus(node.id);
            }
            notify.success({ message: 'Host failover status updated' });
            storeFetchNodes();
          } catch (err) {
            notify.error({
              message: 'Error updating host failover status',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, storeFetchNodes, networkNodes],
  );

  const disconnectNodeFromNetwork = useCallback(
    (newStatus: boolean, node: ExtendedNode) => {
      Modal.confirm({
        title: newStatus ? 'Connect host to network' : 'Disconnect host from network',
        content: (
          <>
            <Row>
              <Col xs={24}>
                <Typography.Text>
                  Are you sure you want {node?.name ?? ''} to {newStatus ? 'connect to' : 'disconnect from'} the
                  network?
                </Typography.Text>
              </Col>
            </Row>
          </>
        ),
        async onOk() {
          try {
            if (!networkId) return;
            const updatedNode = (await NodesService.updateNode(node.id, networkId, { ...node, connected: newStatus }))
              .data;
            store.updateNode(node.id, updatedNode);
            notify.success({
              message: `Successfully ${newStatus ? 'connected' : 'disconnected'}`,
              description: `${node?.name ?? 'Host'} is now ${
                newStatus ? 'connected to' : 'disconnected from'
              } network ${networkId}.`,
            });
          } catch (err) {
            notify.error({
              message: 'Failed to update host',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkId, notify, store],
  );

  const removeNodeFromNetwork = useCallback(
    (newStatus: boolean, node: ExtendedNode) => {
      let forceDelete = false;

      Modal.confirm({
        title: 'Remove host from network',
        content: (
          <>
            <Row>
              <Col xs={24}>
                <Typography.Text>
                  Are you sure you want {node?.name ?? ''} to {newStatus ? 'join' : 'leave'} the network?
                </Typography.Text>
              </Col>
              <Col xs={24}>
                <Form.Item
                  htmlFor="force-delete"
                  label="Force delete"
                  valuePropName="checked"
                  style={{ marginBottom: '0px' }}
                >
                  <Checkbox
                    id="force-delete"
                    onChange={(e) => {
                      forceDelete = e.target.checked;
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        ),
        async onOk() {
          try {
            if (!networkId) return;
            await HostsService.updateHostsNetworks(node.hostid, networkId, newStatus ? 'join' : 'leave', forceDelete);
            if (forceDelete) {
              storeDeleteNode(node.id);
            }
            notify.success({
              message: `Successfully ${newStatus ? 'connected' : 'disconnected'}`,
              description: `${node?.name ?? 'Host'} is now ${
                newStatus ? 'connected to' : 'disconnected from'
              } network ${networkId}. This may take some seconds to reflect.`,
            });
          } catch (err) {
            notify.error({
              message: 'Failed to update host',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkId, notify, storeDeleteNode],
  );

  return (
    <div className="NetworkNodesPage" style={{ position: 'relative', height: '100%', padding: isFullScreen ? 0 : 24 }}>
      <div className={`${isFullScreen ? 'page-padding' : ''}`}>
        <Row style={{ marginBottom: '1rem', width: '100%' }}>
          <Col>
            <Typography.Title level={2}>Network Nodes</Typography.Title>
          </Col>
        </Row>
        <Row justify="space-between" style={{ marginBottom: '1rem', width: '100%' }}>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Search nodes"
              value={searchHost}
              onChange={(ev) => setSearchHost(ev.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              style={{ marginBottom: '.5rem' }}
            />
          </Col>
          <Col xs={24} md={6} className="add-host-dropdown-button">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'new-host',
                    label: 'Add New Device',
                    onClick() {
                      setIsAddNewHostModalOpen(true);
                    },
                  },
                  {
                    key: 'existing-host',
                    label: 'Add Existing Devices',
                    onClick() {
                      setIsAddHostsToNetworkModalOpen(true);
                    },
                  },
                ],
              }}
            >
              <Button type="primary" style={{ width: '170px', marginBottom: '.5rem' }}>
                <Space>
                  Add Node
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
            <Button
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              onClick={() => {
                alert('Tour is not implemented yet');
              }}
              icon={<InfoCircleOutlined />}
            >
              Tour Nodes
            </Button>
            <Button
              title="Go to Nodes documentation"
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              href={ExternalLinks.HOSTS_DOCS_URL}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            {isManagedHostIsLoading && (
              <Alert
                message="Managed host creation in progress (estimated completion time: 5 - 10 minutes)."
                type="info"
                showIcon
                icon={<LoadingOutlined />}
                style={{ marginBottom: '1rem' }}
              />
            )}
            {isServerEE && networkNodes.length > 0 && !isFailoverNodePresentInNetwork && (
              <Alert
                message="There's no failover host present in the network. Set one for redundancy, in case of failure."
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: '1rem' }}
                action={
                  <Button
                    type="dashed"
                    onClick={() => {
                      setIsSetNetworkFailoverModalOpen(true);
                    }}
                  >
                    Set Failover Host
                  </Button>
                }
              />
            )}
            <div className="table-wrapper">
              <Table
                scroll={{ x: true }}
                columns={[
                  {
                    title: 'Host Name',
                    render: (_, node) => {
                      const hostName = getExtendedNode(node, store.hostsCommonDetails).name;
                      return (
                        <>
                          <Link
                            to={getNetworkHostRoute(node.hostid, node.network)}
                            title={`Network Host ID: ${node.id}`}
                          >
                            {hostName}
                          </Link>
                          {node.pendingdelete && (
                            <Badge style={{ marginLeft: '1rem' }} status="processing" color="red" text="Removing..." />
                          )}
                          {isServerEE && node.is_fail_over && (
                            <Tooltip title="This host is acting as the network's failover host">
                              <Waypoints
                                style={{ marginLeft: '.5rem' }}
                                color={
                                  store.currentTheme === 'dark' ? branding.primaryColorDark : branding.primaryColorLight
                                }
                                size="1.2rem"
                                strokeWidth={1.5}
                              />
                            </Tooltip>
                          )}
                        </>
                      );
                    },
                    sorter: (a, b) => {
                      const hostNameA = getExtendedNode(a, store.hostsCommonDetails).name;
                      const hostNameB = getExtendedNode(b, store.hostsCommonDetails).name;
                      return hostNameA?.localeCompare(hostNameB ?? '') ?? 0;
                    },
                    defaultSortOrder: 'ascend',
                  },
                  network?.isipv4
                    ? {
                        title: 'Private Address (IPv4)',
                        dataIndex: 'address',
                      }
                    : {},
                  network?.isipv6
                    ? {
                        title: 'Private Address (IPv6)',
                        dataIndex: 'address6',
                      }
                    : {},
                  {
                    title: 'Public Address (IPv4)',
                    render(_, node) {
                      return getExtendedNode(node, store.hostsCommonDetails)?.endpointip ?? '';
                    },
                  },
                  {
                    title: 'Public Address (IPv6)',
                    render(_, node) {
                      return getExtendedNode(node, store.hostsCommonDetails)?.endpointipv6 ?? '';
                    },
                  },
                  {
                    title: 'Connectivity',
                    render: (_, node) => (
                      <Tag color={node.connected ? 'green' : 'red'}>
                        {node.connected ? 'Connected' : 'Disconnected'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Health Status',
                    render(_, node) {
                      return getHostHealth(node.hostid, [node]);
                    },
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
                  },
                  {
                    width: '1rem',
                    align: 'right',
                    render(_: boolean, node) {
                      return (
                        <Dropdown
                          menu={{
                            items: (
                              [
                                {
                                  key: 'edit',
                                  label: 'Edit',
                                  disabled: node.pendingdelete !== false,
                                  title: node.pendingdelete !== false ? 'Host is being removed from network' : '',
                                  onClick: () => editNode(node),
                                },
                              ] as any[]
                            )
                              .concat(
                                isServerEE
                                  ? [
                                      {
                                        key: 'failover',
                                        label: node.is_fail_over ? 'Unset as failover' : 'Set as failover',
                                        title: node.is_fail_over
                                          ? 'Stop this host as acting as the network failover'
                                          : 'Make this the network failover host. Any existing failover host will be replaced.',
                                        onClick: () => confirmNodeFailoverStatusChange(node, !node.is_fail_over),
                                      },
                                    ]
                                  : [],
                              )
                              .concat([
                                {
                                  key: 'disconnect',
                                  label: node.connected ? 'Disconnect host' : 'Connect host',
                                  disabled: node.pendingdelete !== false,
                                  title: node.pendingdelete !== false ? 'Host is being disconnected from network' : '',

                                  onClick: () =>
                                    disconnectNodeFromNetwork(
                                      !node.connected,
                                      getExtendedNode(node, store.hostsCommonDetails),
                                    ),
                                },
                                {
                                  key: 'remove',
                                  label: 'Remove from network',
                                  danger: true,
                                  onClick: () =>
                                    removeNodeFromNetwork(false, getExtendedNode(node, store.hostsCommonDetails)),
                                },
                              ]),
                          }}
                        >
                          <MoreOutlined />
                        </Dropdown>
                      );
                    },
                  },
                ]}
                dataSource={filteredNetworkNodes}
                rowKey="id"
                size="small"
                loading={isLoadingNetwork}
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
      <AddHostsToNetworkModal
        isOpen={isAddHostsToNetworkModalOpen}
        networkId={resolvedNetworkId}
        onNetworkUpdated={() => {
          store.fetchNetworks();
          setIsAddHostsToNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddHostsToNetworkModalOpen(false)}
      />
      <NewHostModal
        isOpen={isAddNewHostModalOpen}
        onFinish={() => {
          setIsAddNewHostModalOpen(false);
        }}
        onCancel={() => setIsAddNewHostModalOpen(false)}
        networkId={networkId}
      />
      <SetNetworkFailoverModal
        isOpen={isSetNetworkFailoverModalOpen}
        networkId={resolvedNetworkId}
        onSetFailover={() => {
          setIsSetNetworkFailoverModalOpen(false);
        }}
        onCancel={() => setIsSetNetworkFailoverModalOpen(false)}
      />
      {targetNode && (
        <UpdateNodeModal
          key={`update-node-${targetNode.id}`}
          isOpen={isUpdateNodeModalOpen}
          node={targetNode}
          onUpdateNode={() => {
            store.fetchNodes();
            setIsUpdateNodeModalOpen(false);
          }}
          onCancel={() => setIsUpdateNodeModalOpen(false)}
        />
      )}
    </div>
  );
}
