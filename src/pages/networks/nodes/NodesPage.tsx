import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Typography,
  Input,
  Table,
  notification,
  Dropdown,
  Modal,
  Switch,
  Layout,
  Form,
  Checkbox,
  Badge,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ServerIcon, DocumentIcon, UserIcon, PlusIcon } from '@heroicons/react/24/solid';
import { ExtendedNode, Node } from '@/models/Node';
import { NodesService } from '@/services/NodesService';
import { HostsService } from '@/services/HostsService';
import { useStore } from '@/store/store';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { getHostHealth, useBranding } from '@/utils/Utils';
import { HOST_HEALTH_STATUS } from '@/models/NodeConnectivityStatus';
import RacDownloadBanner from '@/components/RacDownloadBanner';
import AddNodeDialog from '@/components/modals/add-node-modal/AddNodeDialog';
import NodeStatus from '@/components/ui/Status';
import { isSaasBuild } from '@/services/BaseService';
import UpdateNodeModal from '@/components/modals/update-node-modal/UpdateNodeModal';
import { ExternalClient } from '@/models/ExternalClient';
import { getNetworkHostRoute } from '@/utils/RouteUtils';
import { WaypointsIcon } from 'lucide-react';
import { AxiosError } from 'axios';
import ClientDetailsModal from '@/components/modals/client-detaiils-modal/ClientDetailsModal';
import ClientConfigModal from '@/components/modals/client-config-modal/ClientConfigModal';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';

const HOSTS_DOCS_URL = 'https://docs.netmaker.io/docs/references/user-interface#hosts';

export default function NodesPage() {
  const { selectedNetwork } = useStore((state) => ({
    selectedNetwork: state.selectedNetwork,
  }));
  const networkId = selectedNetwork;
  console.log(networkId, selectedNetwork);

  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();
  const branding = useBranding();

  // State management
  const [searchHost, setSearchHost] = useState('');
  const [isAddNewHostModalOpen, setIsAddNewHostModalOpen] = useState(false);
  const [activeNodeFilter, setActiveNodeFilter] = useState('Netclient');
  const [targetNode, setTargetNode] = useState<Node | null>(null);
  const [isUpdateNodeModalOpen, setIsUpdateNodeModalOpen] = useState(false);
  const [targetClient, setTargetClient] = useState<ExternalClient | null>(null);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [isClientConfigModalOpen, setIsClientConfigModalOpen] = useState(false);
  // Refs
  const createClientConfigModalPostUpRef = useRef(null);
  const createClientConfigModalPostDownRef = useRef(null);

  const filters = useMemo(
    () =>
      [
        { name: 'All', icon: null },
        { name: 'Netclient', icon: ServerIcon },
        { name: 'Config files', icon: DocumentIcon },
      ].concat(!isSaasBuild ? [{ name: 'Active Users', icon: UserIcon }] : []),
    [],
  );

  // Fetch network nodes
  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => ({
          ...getExtendedNode(node, store.hostsCommonDetails),
          tableId: node.is_static ? node.static_node.clientid : node.id,
        }))
        .filter((node) => node.network === networkId || node.static_node.network === networkId),
    [store.nodes, store.hostsCommonDetails, networkId],
  );

  const staticNetworkNodes: Node[] = useMemo(() => store.nodes.filter((node) => node.is_static), [store.nodes]);

  // Add with other callbacks
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
            store.fetchNodes();
          } catch (err) {
            notify.error({
              message: 'Error updating host failover status',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkNodes, notify, store],
  );

  const filteredNetworkNodes = useMemo<ExtendedNode[]>(() => {
    const filtered = networkNodes.filter((node) => {
      const nodeString =
        `${node?.name ?? ''}${node.address ?? ''}${node.address6 ?? ''}${node.id ?? ''}${node.endpointip ?? ''}${node.publickey ?? ''}`.toLowerCase();
      const matchesSearch = nodeString.includes(searchHost.toLowerCase());

      if (!matchesSearch) return false;

      const shouldInclude = (() => {
        switch (activeNodeFilter) {
          case 'Netclient':
            return !node.is_static && !node.is_user_node;
          case 'Config files':
            return node.is_static && !node.is_user_node;
          case 'Active Users':
            return node.is_user_node;
          case 'All':
            return true;
          default:
            return true;
        }
      })();

      return shouldInclude;
    });

    return filtered;
  }, [searchHost, networkNodes, activeNodeFilter]);

  const loadClients = useCallback(async () => {
    try {
      if (!networkId) return;
      const networkClients = (await NodesService.getNetworkExternalClients(networkId)).data ?? [];
      setClients(networkClients);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) return;
      notify.error({
        message: 'Error loading clients',
        description: extractErrorMsg(err as any),
      });
    }
  }, [networkId, notify]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Edit node
  const editNode = useCallback((node: Node) => {
    setTargetNode(node);
    setIsUpdateNodeModalOpen(true);
  }, []);

  // Remove node from network
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
              store.deleteNode(node.id);
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
    [networkId, notify, store],
  );

  // Disconnect node from network
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

  const filterByHostHealthStatus = (value: React.Key | boolean, record: Node): boolean => {
    if (typeof value === 'boolean' || value === undefined || typeof value === 'number') {
      return false;
    }

    if (!record && value === HOST_HEALTH_STATUS.unknown) {
      return true;
    }

    const nodeHealth = getNodeConnectivityStatus(record as ExtendedNode);
    return nodeHealth === value;
  };

  return (
    <Layout.Content style={{ padding: 24 }}>
      <Row style={{ width: '100%', marginBottom: '1rem' }}>
        {!isSaasBuild && <RacDownloadBanner />}

        <div className="flex flex-col w-full gap-4 md:flex-row">
          <div className="inline-flex flex-col flex-grow gap-4 md:flex-row">
            <Input
              size="large"
              placeholder="Search nodes"
              value={searchHost}
              onChange={(ev) => setSearchHost(ev.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              style={{ maxWidth: '240px', height: '40px' }}
            />
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.name}
                  onClick={() => setActiveNodeFilter(filter.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-200 ${
                    activeNodeFilter === filter.name
                      ? 'bg-button-secondary-fill-default text-text-primary'
                      : 'bg-transparent text-text-secondary hover:bg-button-secondary-fill-hover'
                  }`}
                >
                  {filter.icon && <filter.icon className="flex-shrink-0 w-4 h-4" />}
                  <span className="whitespace-nowrap">{filter.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              className="flex items-center justify-center gap-1 px-4 py-2"
              onClick={() => setIsAddNewHostModalOpen(true)}
            >
              <PlusIcon className="w-5 h-5" /> <span>Add Node</span>
            </Button>
            <Button
              title="Go to HOSTS documentation"
              className="flex items-center justify-center"
              href={HOSTS_DOCS_URL}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
          </div>
        </div>

        <Col xs={24} style={{ paddingTop: '1rem' }}>
          <div className="table-wrapper">
            <Table
              rowKey="tableId"
              scroll={{ x: true }}
              dataSource={filteredNetworkNodes}
              size="small"
              className="table-wrapper"
              columns={[
                {
                  title: 'Node name',
                  render: (_, node) => {
                    const hostName = getExtendedNode(node, store.hostsCommonDetails).name;
                    return (
                      <>
                        <Link
                          to={node.is_static ? '#' : getNetworkHostRoute(node.hostid, node.network)}
                          title={`Network Host ID: ${node.is_static ? node.static_node.clientid : node.id}`}
                          className="inline-flex items-center gap-2"
                          onClick={(e) => {
                            if (node.is_static) {
                              e.preventDefault();
                              const clientData: ExternalClient = {
                                clientid: node.static_node?.clientid ?? '',
                                description: '',
                                privatekey: node.static_node?.privatekey ?? '',
                                publickey: node.static_node?.publickey ?? '',
                                network: networkId ?? '',
                                address: node.static_node?.address ?? '',
                                address6: node.static_node?.address6 ?? '',
                                ingressgatewayid: node.static_node?.ingressgatewayid ?? '',
                                ingressgatewayendpoint: node.static_node?.ingressgatewayendpoint ?? '',
                                lastmodified: node.lastmodified ?? 0,
                                enabled: node.static_node?.enabled ?? false,
                                ownerid: node.static_node?.ownerid ?? '',
                                internal_ip_addr: '',
                                internal_ip_addr6: '',
                                dns: node.static_node?.dns ?? '',
                                extraallowedips: node.static_node?.extraallowedips ?? [],
                                postup: node.static_node?.postup,
                                postdown: node.static_node?.postdown,
                                tags: node.static_node?.tags ?? {},
                              };
                              setTargetClient(clientData);
                              setIsClientDetailsModalOpen(true);
                            }
                          }}
                        >
                          {getExtendedNode(node, store.hostsCommonDetails).is_static &&
                          !getExtendedNode(node, store.hostsCommonDetails).is_user_node ? (
                            <DocumentIcon className="w-4 h-4 shrink-0 text-text-primary" />
                          ) : getExtendedNode(node, store.hostsCommonDetails).is_user_node ? (
                            <UserIcon className="w-4 h-4 shrink-0 text-text-primary" />
                          ) : (
                            <ServerIcon className="w-4 h-4 shrink-0 text-text-primary" />
                          )}
                          <span>
                            {node.is_user_node
                              ? node.static_node?.ownerid
                              : node.is_static
                                ? node.static_node?.clientid
                                : hostName}
                          </span>
                        </Link>
                        {node.pendingdelete && (
                          <Badge style={{ marginLeft: '1rem' }} status="processing" color="red" text="Removing..." />
                        )}
                        {!isSaasBuild && node.is_fail_over && (
                          <Tooltip title="This host is acting as the network's failover host">
                            <WaypointsIcon
                              style={{ marginLeft: '.5rem', marginBottom: '.5rem', display: 'inline' }}
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
                {
                  title: 'Private Address',
                  render: (_, node) => {
                    if (node.is_static) {
                      if (node.static_node?.address !== '') {
                        return node.static_node?.address;
                      } else {
                        return node.static_node?.address6;
                      }
                    } else {
                      if (node.address !== '') {
                        return node.address;
                      } else {
                        return node.address6;
                      }
                    }
                    return '';
                  },
                },
                {
                  title: 'Public Address',
                  render: (_, node) => {
                    const extendedNode = getExtendedNode(node, store.hostsCommonDetails);
                    // Prefer IPv4 if it exists and isn't empty
                    if (extendedNode?.endpointip !== '') {
                      return extendedNode.endpointip;
                    }
                    // Fall back to IPv6 if IPv4 is empty
                    return extendedNode?.endpointipv6 || '';
                  },
                },
                {
                  title: 'Gateway',
                  render(_, node) {
                    const extendedNode = getExtendedNode(node, store.hostsCommonDetails);
                    const gatewayId = extendedNode.static_node?.ingressgatewayendpoint;
                    if (extendedNode.is_static && extendedNode.static_node && gatewayId) {
                      const gatewayNode = networkNodes.find((n) => n.id === node.static_node?.ingressgatewayid);
                      const gatewayName = gatewayNode ? gatewayNode.name : 'gatewayId';

                      return (
                        <span className="flex items-center gap-2">
                          <ServerIcon className="w-4 h-4 shrink-0 text-text-primary" />
                          <span className="w-full break-words">{gatewayName}</span>
                        </span>
                      );
                    } else {
                      return '-';
                    }
                  },
                },
                {
                  title: 'External Routes',
                  render(_, node) {
                    const extendedNode = getExtendedNode(node, store.hostsCommonDetails);
                    if (extendedNode.is_static && extendedNode.static_node) {
                      const allowedIPs = extendedNode.static_node.extraallowedips;
                      if (Array.isArray(allowedIPs) && allowedIPs.length > 0) {
                        return allowedIPs.join(', ');
                      } else {
                        return '-';
                      }
                    } else {
                      return '-';
                    }
                  },
                },
                {
                  title: 'Status',
                  render(_, node) {
                    const extendedNode = getExtendedNode(node, store.hostsCommonDetails);
                    if (extendedNode.is_static) {
                      return node.static_node?.enabled ? (
                        <NodeStatus nodeHealth="enabled" clickable />
                      ) : (
                        <NodeStatus nodeHealth="disabled" clickable />
                      );
                    } else if (!extendedNode.connected) {
                      return <NodeStatus nodeHealth="disconnected" clickable />;
                    }
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
                  onFilter: filterByHostHealthStatus,
                },
                {
                  width: '1rem',
                  align: 'right',
                  render(_, node) {
                    const extendedNode = getExtendedNode(node, store.hostsCommonDetails);
                    const regularNodeMenu = [
                      {
                        key: 'edit',
                        label: 'Edit',
                        disabled: node.pendingdelete !== false,
                        title: node.pendingdelete !== false ? 'Host is being removed from network' : '',
                        onClick: () => editNode(node),
                      },
                      ...(!isSaasBuild
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
                        : []),
                      {
                        key: 'disconnect',
                        label: node.connected ? 'Disconnect host' : 'Connect host',
                        disabled: node.pendingdelete !== false,
                        title: node.pendingdelete !== false ? 'Host is being disconnected from network' : '',
                        onClick: () => disconnectNodeFromNetwork(!node.connected, extendedNode),
                      },
                      {
                        key: 'remove',
                        label: 'Remove from network',
                        danger: true,
                        onClick: () => removeNodeFromNetwork(false, extendedNode),
                      },
                    ];

                    return (
                      <Dropdown
                        menu={{
                          items: !extendedNode.is_static
                            ? regularNodeMenu
                            : [
                                {
                                  key: 'edit',
                                  label: (
                                    <Typography.Text
                                      disabled={
                                        !isAdminUserOrRole(store.user!) && store.username !== node.static_node?.ownerid
                                      }
                                    >
                                      <EditOutlined /> Edit
                                    </Typography.Text>
                                  ),
                                  disabled:
                                    !isAdminUserOrRole(store.user!) && store.username !== node.static_node?.ownerid,
                                  onClick: () => {
                                    const clientData: ExternalClient = {
                                      clientid: node.static_node?.clientid ?? '',
                                      description: '',
                                      privatekey: node.static_node?.privatekey ?? '',
                                      publickey: node.static_node?.publickey ?? '',
                                      network: networkId ?? '',
                                      address: node.static_node?.address ?? '',
                                      address6: node.static_node?.address6 ?? '',
                                      ingressgatewayid: node.static_node?.ingressgatewayid ?? '',
                                      ingressgatewayendpoint: node.static_node?.ingressgatewayendpoint ?? '',
                                      lastmodified: node.lastmodified ?? 0,
                                      enabled: node.static_node?.enabled ?? false,
                                      ownerid: node.static_node?.ownerid ?? '',
                                      internal_ip_addr: '',
                                      internal_ip_addr6: '',
                                      dns: node.static_node?.dns ?? '',
                                      extraallowedips: node.static_node?.extraallowedips ?? [],
                                      postup: node.static_node?.postup,
                                      postdown: node.static_node?.postdown,
                                      tags: node.static_node?.tags ?? {},
                                    };
                                    setTargetClient(clientData);
                                    setIsClientDetailsModalOpen(true);
                                  },
                                },
                                {
                                  key: 'view',
                                  label: (
                                    <Typography.Text
                                      disabled={
                                        !isAdminUserOrRole(store.user!) && store.username !== node.static_node?.ownerid
                                      }
                                    >
                                      <EyeOutlined /> View Config
                                    </Typography.Text>
                                  ),
                                  disabled:
                                    !isAdminUserOrRole(store.user!) && store.username !== node.static_node?.ownerid,
                                  onClick: () => {
                                    const clientData: ExternalClient = {
                                      clientid: node.static_node?.clientid ?? '',
                                      description: '',
                                      privatekey: node.static_node?.privatekey ?? '',
                                      publickey: node.static_node?.publickey ?? '',
                                      network: networkId ?? '',
                                      address: node.static_node?.address ?? '',
                                      address6: node.static_node?.address6 ?? '',
                                      ingressgatewayid: node.static_node?.ingressgatewayid ?? '',
                                      ingressgatewayendpoint: node.static_node?.ingressgatewayendpoint ?? '',
                                      lastmodified: node.lastmodified ?? 0,
                                      enabled: node.static_node?.enabled ?? false,
                                      ownerid: node.static_node?.ownerid ?? '',
                                      internal_ip_addr: '',
                                      internal_ip_addr6: '',
                                      dns: node.static_node?.dns ?? '',
                                      extraallowedips: node.static_node?.extraallowedips ?? [],
                                      postup: node.static_node?.postup,
                                      postdown: node.static_node?.postdown,
                                      tags: node.static_node?.tags ?? {},
                                    };
                                    setTargetClient(clientData);
                                    setIsClientConfigModalOpen(true);
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
                                  disabled:
                                    !isAdminUserOrRole(store.user!) && store.username !== node.static_node?.ownerid,
                                  onClick: () => {
                                    // Add client deletion logic here
                                    if (!networkId || !node.static_node?.clientid) return;
                                    Modal.confirm({
                                      title: `Delete client ${node.static_node.clientid}`,
                                      content: 'Are you sure you want to delete this client?',
                                      onOk: async () => {
                                        try {
                                          await NodesService.deleteExternalClient(
                                            node.static_node!.clientid,
                                            networkId,
                                          );
                                          store.fetchNodes();
                                          loadClients();
                                          notify.success({ message: 'Client deleted successfully' });
                                        } catch (err) {
                                          notify.error({
                                            message: 'Error deleting client',
                                            description: extractErrorMsg(err as any),
                                          });
                                        }
                                      },
                                    });
                                  },
                                },
                              ],
                        }}
                      >
                        <MoreOutlined />
                      </Dropdown>
                    );
                  },
                },
              ]}
            />
          </div>
        </Col>
      </Row>

      {/* Modals */}
      <AddNodeDialog
        networkId={networkId ?? ''}
        isOpen={isAddNewHostModalOpen}
        onClose={() => setIsAddNewHostModalOpen(false)}
        onCreateClient={() => {
          loadClients();
          store.fetchNodes();
        }}
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

      {targetClient && (
        <>
          <ClientDetailsModal
            key={`view-client-${targetClient.clientid}`}
            isOpen={isClientDetailsModalOpen}
            client={targetClient}
            onViewConfig={() => setIsClientConfigModalOpen(true)}
            onUpdateClient={(updatedClient) => {
              setClients((prev) => prev.map((c) => (c.clientid === targetClient.clientid ? updatedClient : c)));
              setTargetClient(updatedClient);
            }}
            onCancel={() => setIsClientDetailsModalOpen(false)}
          />

          <ClientConfigModal
            key={`view-client-config-${targetClient.clientid}`}
            isOpen={isClientConfigModalOpen}
            client={targetClient}
            gateway={networkNodes.find((node) => node.id === targetClient.ingressgatewayid) || ({} as Node)}
            onCancel={() => setIsClientConfigModalOpen(false)}
          />
        </>
      )}

      {notifyCtx}
    </Layout.Content>
  );
}
