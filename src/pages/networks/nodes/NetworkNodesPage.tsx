import AddHostsToNetworkModal from '@/components/modals/add-hosts-to-network-modal/AddHostsToNetworkModal';
import AddNodeDialog from '@/components/modals/add-node-modal/AddNodeDialog';
import ClientDetailsModal from '@/components/modals/client-detaiils-modal/ClientDetailsModal';
import NewHostModal from '@/components/modals/new-host-modal/NewHostModal';
import SetNetworkFailoverModal from '@/components/modals/set-network-failover-modal/SetNetworkFailoverModal';
import UpdateClientModal from '@/components/modals/update-client-modal/UpdateClientModal';
import UpdateNodeModal from '@/components/modals/update-node-modal/UpdateNodeModal';
import RacDownloadBanner from '@/components/RacDownloadBanner';
import { GatewaysCombobox } from '@/components/ui/GatewayCombobox';
import NodeStatus from '@/components/ui/Status';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import PageLayout from '@/layouts/PageLayout';
import { NodeAclContainer } from '@/models/Acl';
import { ExternalClient } from '@/models/ExternalClient';
import { ExtendedNode, Node } from '@/models/Node';
import { HOST_HEALTH_STATUS } from '@/models/NodeConnectivityStatus';
import { isSaasBuild } from '@/services/BaseService';
import UpdateIngressModal from '@/components/modals/update-remote-access-gateway-modal/UpdateRemoteAccessGatewayModal';

import { HostsService } from '@/services/HostsService';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, getNodeConnectivityStatus, isNodeRelay } from '@/utils/NodeUtils';
import { getNetworkHostRoute } from '@/utils/RouteUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { hasNetworkAdminPriviledges } from '@/utils/UserMgmtUtils';
import { getHostHealth, isManagedHost, useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  QuestionCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  Cog6ToothIcon,
  DocumentIcon,
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  PlusIcon,
  ServerIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import { ComputerDesktopIcon } from '@heroicons/react/24/solid';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  MenuProps,
  Modal,
  notification,
  Row,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { ChevronsUpDown, WaypointsIcon } from 'lucide-react';
import { Key, useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button as PButton } from '@/components/shadcn/Button';
import { GatewaysFilterCombobox } from '@/components/ui/GatewayFilterCombobox';

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchHost, setSearchHost] = useState('');
  const [isAddNewHostModalOpen, setIsAddNewHostModalOpen] = useState(false);
  const [isAddHostsToNetworkModalOpen, setIsAddHostsToNetworkModalOpen] = useState(false);
  const [isSetNetworkFailoverModalOpen, setIsSetNetworkFailoverModalOpen] = useState(false);
  const [targetNode, setTargetNode] = useState<Node | null>(null);
  const [isUpdateNodeModalOpen, setIsUpdateNodeModalOpen] = useState(false);
  const [activeNodeFilter, setActiveNodeFilter] = useState('Netclient');
  const [targetClient, setTargetClient] = useState<ExternalClient | null>(null);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);
  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [isClientConfigModalOpen, setIsClientConfigModalOpen] = useState(false);
  const [originalAcls, setOriginalAcls] = useState<NodeAclContainer>({});
  const [acls, setAcls] = useState<NodeAclContainer>({});
  const [selectedGateway, setSelectedGateway] = useState<Node | null>(null);
  const [isUpdateGatewayModalOpen, setIsUpdateGatewayModalOpen] = useState(false);
  const [gatewayFilter, setGatewayFilter] = useState('all-nodes');

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

  const isGateway = (node: ExtendedNode) => {
    return node.isingressgateway && node.isrelay;
  };

  const filteredNetworkNodes = useMemo<ExtendedNode[]>(() => {
    const filtered = networkNodes.filter((node) => {
      const nodeString =
        `${node?.name ?? ''}${node.address ?? ''}${node.address6 ?? ''}${node.id ?? ''}${node.endpointip ?? ''}${node.publickey ?? ''}`.toLowerCase();
      const matchesSearch = nodeString.includes(searchHost.toLowerCase());

      if (!matchesSearch) return false;

      const matchesNodeType = (() => {
        switch (activeNodeFilter) {
          case 'Netclient':
            return !node.is_static && !node.is_user_node;
          case 'Config files':
            return node.is_static && !node.is_user_node;
          case 'Active Users':
            return node.is_user_node;

          default:
            return true;
        }
      })();

      if (!matchesNodeType) return false;

      const matchesGatewayFilter = (() => {
        const extendedNode = getExtendedNode(node, store.hostsCommonDetails);

        switch (gatewayFilter) {
          case 'gateways':
            return isGateway(node);
          case 'has-gateway-assigned': {
            const hasGateway = !!extendedNode.static_node?.ingressgatewayid || !!extendedNode.relayedby;
            return hasGateway;
          }
          case 'all-nodes':
          default:
            return true;
        }
      })();

      return matchesGatewayFilter;
    });

    return filtered;
  }, [searchHost, networkNodes, activeNodeFilter, gatewayFilter, store.hostsCommonDetails]);

  const filters = useMemo(
    () =>
      [
        { name: 'Netclient', icon: ServerIcon },
        { name: 'Config files', icon: DocumentIcon },
      ].concat(isServerEE ? [{ name: 'Active Users', icon: UserIcon }] : []),
    [isServerEE],
  );

  const isFailoverNodePresentInNetwork = useMemo(() => {
    return networkNodes.some((node) => node.is_fail_over);
  }, [networkNodes]);

  // const checkIfManagedHostIsLoading = useMemo(() => {
  //   // check if managed host is loading
  //   const isNewTenant = store.isNewTenant;
  //   const isManagedHostLoaded = store.hosts.some((host) => isManagedHost(host.name));
  //   return isSaasBuild && isNewTenant && !isManagedHostLoaded;
  // }, [store.isNewTenant, store.hosts]);

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

  const loadAcls = useCallback(async () => {
    try {
      if (!networkId) return;
      const acls = (await NetworksService.getAcls(networkId)).data;
      setOriginalAcls(acls);
      setAcls(acls);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err instanceof AxiosError && err.response?.status === 403) return;
        notify.error({
          message: 'Error loading ACLs',
          description: extractErrorMsg(err),
        });
      }
    }
  }, [networkId, notify]);

  const toggleClientStatus = useCallback(
    async (client: ExternalClient, newStatus: boolean) => {
      if (!networkId) return;
      Modal.confirm({
        title: `Are you sure you want to ${newStatus ? 'enable' : 'disable'} client ${client.clientid}?`,
        content: `Client ${client.clientid} will be ${newStatus ? 'enabled' : 'disabled'}.`,
        onOk: async () => {
          try {
            const newClient = (
              await NodesService.updateExternalClient(client.clientid, networkId, {
                ...client,
                clientid: client.clientid,
                enabled: newStatus,
              })
            ).data;
            setClients((prev) => prev.map((c) => (c.clientid === newClient.clientid ? newClient : c)));
          } catch (err) {
            notify.error({
              message: 'Failed to update client',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkId, notify],
  );

  const confirmDeleteClient = useCallback(
    (client: ExternalClient) => {
      Modal.confirm({
        title: `Delete client ${client.clientid}`,
        content: `Are you sure you want to delete this client?`,
        onOk: async () => {
          try {
            await NodesService.deleteExternalClient(client.clientid, client.network);
            setClients((prev) => prev.filter((c) => c.clientid !== client.clientid));
            storeFetchNodes();
            loadAcls();
          } catch (err) {
            notify.error({
              message: 'Error deleting Client',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [loadAcls, notify, storeFetchNodes],
  );

  const handleBulkDelete = useCallback(() => {
    const nodesToDelete = filteredNetworkNodes.filter((node) =>
      selectedRowKeys.includes(node.is_static ? node.static_node.clientid : node.id),
    );

    const title = activeNodeFilter === 'Netclient' ? 'Remove Selected from Network' : 'Delete Selected';

    Modal.confirm({
      title,
      content: (
        <>
          <Typography.Text>
            Are you sure you want to{' '}
            {activeNodeFilter === 'Netclient' ? 'remove these nodes from the network' : 'delete'}{' '}
            {selectedRowKeys.length} nodes?
          </Typography.Text>
          <ul className="pl-4 mt-2 list-disc">
            {nodesToDelete.map((node) => (
              <li key={node.id}>
                {node.is_user_node
                  ? node.static_node?.ownerid
                  : node.is_static
                    ? node.static_node?.clientid
                    : node.name}
              </li>
            ))}
          </ul>
        </>
      ),
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await Promise.all(
            nodesToDelete.map(async (node) => {
              if (node.is_static) {
                await NodesService.deleteExternalClient(node.static_node.clientid, networkId!);
              } else {
                await HostsService.updateHostsNetworks(node.hostid, networkId!, 'leave', true);
              }
            }),
          );

          notify.success({
            message:
              activeNodeFilter === 'Netclient'
                ? 'Successfully removed selected nodes from network'
                : 'Successfully deleted selected nodes',
          });
          storeFetchNodes();
          setSelectedRowKeys([]);
        } catch (err) {
          notify.error({
            message:
              activeNodeFilter === 'Netclient' ? 'Failed to remove nodes from network' : 'Failed to delete nodes',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [selectedRowKeys, filteredNetworkNodes, networkId, notify, storeFetchNodes, activeNodeFilter]);

  const createGateway = async (node: ExtendedNode) => {
    try {
      if (!node.isingressgateway && networkId) {
        await NodesService.createIngressNode(node.id, networkId, {
          extclientdns: '',
          is_internet_gw: false,
          metadata: '',
          mtu: 1420,
          persistentkeepalive: 20,
        });
      }

      if (!node.isrelay && networkId) {
        await NodesService.createRelay(node.id, networkId, {
          netid: networkId,
          nodeid: node.id,
          relayaddrs: [],
        });
      }
      await store.fetchNodes();

      notify.success({ message: `Gateway set successfully` });
    } catch (err) {
      notify.error({
        message: 'Failed to set gateway',
        description: extractErrorMsg(err as any),
      });
    }
  };

  const deleteGateway = async (node: ExtendedNode) => {
    Modal.confirm({
      title: `Unset gateway ${node.name}`,
      content: (
        <>
          Are you sure you want to unset this node from acting as a gateway?
          <br />
          Any attached nodes be disconnected and any config file using this gateway will be deleted.
        </>
      ),
      onOk: async () => {
        try {
          if (networkId && node.isingressgateway) {
            await NodesService.deleteIngressNode(node.id, networkId);
          }
          if (networkId && node.isrelay) {
            await NodesService.deleteRelay(node.id, networkId);
          }

          store.updateNode(node.id, {
            ...node,
            isingressgateway: false,
            relaynodes: [],
            isrelay: false,
          });

          store.fetchNodes();

          notify.success({ message: 'Gateway unset successfully' });
        } catch (err) {
          notify.error({
            message: 'Failed to unset gateway',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  };

  const handleBulkToggleStaticFiles = useCallback(() => {
    const selectedNodes = filteredNetworkNodes.filter((node) =>
      selectedRowKeys.includes(node.is_static ? node.static_node.clientid : node.id),
    );
    const enabling = selectedNodes.some((node) => (node.is_static ? !node.static_node.enabled : !node.connected));

    Modal.confirm({
      title: `${enabling ? 'Enable' : 'Disable'} Selected ${activeNodeFilter}`,
      content: (
        <>
          <Typography.Text>
            Are you sure you want to {enabling ? 'enable' : 'disable'} these {selectedNodes.length}{' '}
            {activeNodeFilter.toLowerCase()}?
          </Typography.Text>
          <ul className="pl-4 mt-2 list-disc">
            {selectedNodes.map((node) => (
              <li key={node.is_static ? node.static_node.clientid : node.id}>
                {node.is_user_node ? node.static_node.ownerid : node.is_static ? node.static_node.clientid : node.name}
              </li>
            ))}
          </ul>
        </>
      ),
      onOk: async () => {
        try {
          await Promise.all(
            selectedNodes.map((node) => {
              if (node.is_static) {
                const clientData: ExternalClient = {
                  clientid: node.static_node.clientid,
                  description: '',
                  privatekey: node.static_node.privatekey,
                  publickey: node.static_node.publickey,
                  network: networkId!,
                  address: node.static_node.address,
                  address6: node.static_node.address6,
                  ingressgatewayid: node.static_node.ingressgatewayid,
                  ingressgatewayendpoint: node.static_node.ingressgatewayendpoint,
                  lastmodified: node.lastmodified,
                  enabled: enabling,
                  ownerid: node.static_node.ownerid,
                  internal_ip_addr: '',
                  internal_ip_addr6: '',
                  dns: node.static_node.dns,
                  extraallowedips: node.static_node.extraallowedips,
                  postup: node.static_node.postup,
                  postdown: node.static_node.postdown,
                  tags: node.static_node.tags,
                };
                return NodesService.updateExternalClient(clientData.clientid, networkId!, clientData);
              } else {
                return NodesService.updateNode(node.id, networkId!, { ...node, connected: enabling });
              }
            }),
          );

          notify.success({
            message: `Successfully ${enabling ? 'enabled' : 'disabled'} selected ${activeNodeFilter.toLowerCase()}`,
          });
          storeFetchNodes();
          setSelectedRowKeys([]);
        } catch (err) {
          notify.error({
            message: `Failed to ${enabling ? 'enable' : 'disable'} ${activeNodeFilter.toLowerCase()}`,
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [selectedRowKeys, filteredNetworkNodes, networkId, notify, storeFetchNodes, activeNodeFilter]);

  const handleBulkConnectionToggle = useCallback(() => {
    const nodesToToggle = filteredNetworkNodes.filter((node) => selectedRowKeys.includes(node.id));
    const connecting = nodesToToggle.some((node) => !node.connected);

    Modal.confirm({
      title: `${connecting ? 'Connect' : 'Disconnect'} Selected Nodes`,
      content: (
        <>
          <Typography.Text>
            Are you sure you want to {connecting ? 'connect' : 'disconnect'} these {nodesToToggle.length} nodes?
          </Typography.Text>
          <ul className="pl-4 mt-2 list-disc">
            {nodesToToggle.map((node) => (
              <li key={node.id}>{node.name}</li>
            ))}
          </ul>
        </>
      ),
      onOk: async () => {
        try {
          await Promise.all(
            nodesToToggle.map((node) =>
              NodesService.updateNode(node.id, networkId!, { ...node, connected: connecting }),
            ),
          );
          notify.success({ message: `Successfully ${connecting ? 'connected' : 'disconnected'} selected nodes` });
          storeFetchNodes();
          setSelectedRowKeys([]);
        } catch (err) {
          notify.error({
            message: `Failed to ${connecting ? 'connect' : 'disconnect'} nodes`,
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [selectedRowKeys, filteredNetworkNodes, networkId, notify, storeFetchNodes]);

  const relays = useMemo<ExtendedNode[]>(() => {
    if (!isServerEE) {
      return [];
    }
    return networkNodes.filter((node) => isNodeRelay(node));
  }, [networkNodes, isServerEE]);

  return (
    <PageLayout
      title="Nodes"
      isFullScreen
      description={
        <>
          Deploy and monitor network nodes to extend your infrastructure&apos;s reach and capability.
          <br />
          Manage node configurations, health status, and performance metrics in real-time.
        </>
      }
      icon={<ComputerDesktopIcon className=" size-5" />}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: '1rem', width: '100%' }}>
        {isServerEE && <RacDownloadBanner />}
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
                  onClick={() => {
                    setActiveNodeFilter(filter.name);
                    setSelectedRowKeys([]);
                  }}
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
            <GatewaysFilterCombobox onChange={setGatewayFilter} />
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
              href={ExternalLinks.HOSTS_DOCS_URL}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
          </div>
        </div>{' '}
        <Col xs={24} style={{ paddingTop: '1rem' }}>
          {/* {checkIfManagedHostIsLoading && (
            <Alert
              message="Managed host creation in progress (estimated completion time: 5 - 10 minutes)."
              type="info"
              showIcon
              icon={<LoadingOutlined />}
              style={{ marginBottom: '1rem' }}
            />
          )} */}
          <div className="flex justify-end w-full">
            {selectedRowKeys.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Typography.Text>Selected {selectedRowKeys.length} items</Typography.Text>
                {(activeNodeFilter === 'Config files' || activeNodeFilter === 'Active Users') && (
                  <Button onClick={handleBulkToggleStaticFiles} icon={<PlayCircleOutlined />}>
                    Enable/Disable Selection
                  </Button>
                )}{' '}
                {activeNodeFilter === 'Netclient' && (
                  <Button
                    onClick={handleBulkConnectionToggle}
                    icon={
                      filteredNetworkNodes.some((n) => selectedRowKeys.includes(n.id) && !n.connected) ? (
                        <PlayCircleOutlined />
                      ) : (
                        <StopOutlined />
                      )
                    }
                  >
                    {filteredNetworkNodes.some((n) => selectedRowKeys.includes(n.id) && !n.connected)
                      ? 'Connect'
                      : 'Disconnect'}{' '}
                    Selection
                  </Button>
                )}{' '}
                <Button danger onClick={handleBulkDelete} icon={<DeleteOutlined />}>
                  {activeNodeFilter === 'Netclient' ? 'Remove Selection from Network' : 'Delete Selection'}
                </Button>{' '}
              </div>
            )}
          </div>
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
              rowKey="tableId"
              scroll={{ x: true }}
              dataSource={filteredNetworkNodes}
              size="small"
              rowSelection={{
                selectedRowKeys,
                onChange: (newSelectedRowKeys: React.Key[]) => {
                  setSelectedRowKeys(newSelectedRowKeys);
                },
              }}
              columns={[
                {
                  title: 'Node name',
                  render: (_, node) => {
                    const hostName = getExtendedNode(node, store.hostsCommonDetails).name;
                    return (
                      <>
                        <div className="inline-flex gap-2 ">
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
                          {isGateway(node) && (
                            <Tooltip title="This node can be used as a gateway for other nodes.">
                              <div className="inline-flex items-center justify-center h-6 px-3 rounded-full py-1/2 bg-button-primary-fill-default text-button-primary-text-default text-sm-semibold">
                                Gateway
                              </div>
                            </Tooltip>
                          )}
                        </div>
                        {node.pendingdelete && (
                          <Badge style={{ marginLeft: '1rem' }} status="processing" color="red" text="Removing..." />
                        )}
                        {isServerEE && node.is_fail_over && (
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
                  key: 'id',
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
                  title: (
                    <div className="flex items-center">
                      <span>Gateway</span>
                      <Tooltip title="Gateways are specialized nodes that manage network connections">
                        <InformationCircleIcon className="w-4 ml-2" />
                      </Tooltip>
                    </div>
                  ),
                  render(_, node) {
                    const extendedNode = getExtendedNode(node, store.hostsCommonDetails);
                    const gatewayId = extendedNode.static_node?.ingressgatewayendpoint;
                    const gatewayNode = networkNodes.find(
                      (n) => n.id === node.static_node?.ingressgatewayid || node.relayedby === n.id,
                    );
                    const gatewayName = gatewayNode ? gatewayNode.name : 'gatewayId';
                    if (extendedNode.is_static && extendedNode.static_node && gatewayId) {
                      return (
                        <div className="flex items-center w-full gap-2 ">
                          <Tooltip
                            title={
                              node.is_user_node
                                ? 'Cannot change gateway for user nodes'
                                : 'Cannot change gateway for config files'
                            }
                          >
                            <div className="inline-block w-full cursor-not-allowed">
                              <PButton
                                variant="default"
                                role="combobox"
                                aria-expanded={false}
                                className="justify-between w-full "
                                disabled={node.is_static}
                              >
                                <ServerIcon className="w-4 h-4 shrink-0 text-text-primary" />
                                {gatewayName}
                                <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                              </PButton>
                            </div>
                          </Tooltip>
                          <Tooltip title="Configure this gateway">
                            <Button
                              type="text"
                              icon={<Cog6ToothIcon className="w-4 h-4 m-auto text-text-primary" />}
                              onClick={() => {
                                if (gatewayNode) {
                                  setSelectedGateway(gatewayNode);
                                  setIsUpdateGatewayModalOpen(true);
                                }
                              }}
                              disabled={isGateway(node)}
                            />
                          </Tooltip>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-2">
                          <GatewaysCombobox gateways={relays} node={node} networkId={networkId ?? ''} />
                          {!node.isrelayed ||
                            (!isGateway(node) && (
                              <Tooltip title="Configure this gateway">
                                <Button
                                  type="text"
                                  icon={
                                    <Cog6ToothIcon
                                      className={`w-4 h-4 m-auto text-text-primary ${isGateway(node) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                  }
                                  className="flex items-center justify-center"
                                  onClick={() => {
                                    if (gatewayNode) {
                                      setSelectedGateway(gatewayNode);
                                      setIsUpdateGatewayModalOpen(true);
                                    }
                                  }}
                                  disabled={isGateway(node)}
                                />
                              </Tooltip>
                            ))}
                        </div>
                      );
                    }
                  },
                },
                {
                  title: 'Egress',
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
                  onFilter: (value: React.Key | boolean, record: any) => filterByHostHealthStatus(value, record),
                },
                {
                  width: '1rem',
                  align: 'right',
                  render(_: boolean, node) {
                    const extendedNode = getExtendedNode(node, store.hostsCommonDetails);

                    const staticNodeMenu = [
                      {
                        key: 'edit',
                        label: (
                          <Typography.Text
                            disabled={
                              !hasNetworkAdminPriviledges(store.user!, networkId) &&
                              store.username !== node.static_node?.ownerid
                            }
                          >
                            <EditOutlined /> Edit
                          </Typography.Text>
                        ),
                        disabled:
                          !hasNetworkAdminPriviledges(store.user!, networkId) &&
                          store.username !== node.static_node?.ownerid,
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
                            tags: node.static_node.tags,
                          };
                          setTargetClient(clientData);
                          setIsUpdateClientModalOpen(true);
                        },
                      },
                      {
                        key: 'toggle',
                        icon: node.static_node?.enabled ? <StopOutlined /> : <PlayCircleOutlined />,
                        label: node.static_node?.enabled ? 'Disable' : 'Enable',
                        disabled:
                          !hasNetworkAdminPriviledges(store.user!, networkId) &&
                          store.username !== node.static_node?.ownerid,
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
                            tags: node.static_node.tags,
                          };
                          toggleClientStatus(clientData, !node.static_node?.enabled);
                        },
                      },
                      {
                        key: 'view',
                        label: (
                          <Typography.Text
                            disabled={
                              !hasNetworkAdminPriviledges(store.user!, networkId) &&
                              store.username !== node.static_node?.ownerid
                            }
                          >
                            <EyeOutlined /> View Config
                          </Typography.Text>
                        ),
                        disabled:
                          !hasNetworkAdminPriviledges(store.user!, networkId) &&
                          store.username !== node.static_node?.ownerid,
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
                            tags: node.static_node.tags,
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
                          !hasNetworkAdminPriviledges(store.user!, networkId) &&
                          store.username !== node.static_node?.ownerid,
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
                            tags: node.static_node.tags,
                          };
                          confirmDeleteClient(clientData);
                        },
                      },
                    ] as MenuProps['items'];
                    const regularNodeMenu = [
                      {
                        key: 'edit',
                        label: 'Edit',
                        disabled: node.pendingdelete !== false,
                        title: node.pendingdelete !== false ? 'Host is being removed from network' : '',
                        onClick: () => editNode(node),
                      },
                      ...(isServerEE
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
                        key: 'gateway',
                        label: !isGateway(node) ? 'Set as gateway' : 'Unset as gateway',
                        onClick: () => (isGateway(node) ? deleteGateway(node) : createGateway(node)),
                      },
                      ...(isGateway(node)
                        ? [
                            {
                              key: 'configure-gateway',
                              label: 'Configure Gateway',
                              onClick: () => {
                                setSelectedGateway(node);
                                setIsUpdateGatewayModalOpen(true);
                              },
                            },
                          ]
                        : []),

                      {
                        key: 'disconnect',
                        label: node.connected ? 'Disconnect host' : 'Connect host',
                        disabled: node.pendingdelete !== false,
                        title: node.pendingdelete !== false ? 'Host is being disconnected from network' : '',
                        onClick: () =>
                          disconnectNodeFromNetwork(!node.connected, getExtendedNode(node, store.hostsCommonDetails)),
                      },
                      {
                        key: 'remove',
                        label: 'Remove from network',
                        danger: true,
                        onClick: () => removeNodeFromNetwork(false, getExtendedNode(node, store.hostsCommonDetails)),
                      },
                    ];

                    return (
                      <Dropdown
                        menu={{
                          items: extendedNode.is_static ? staticNodeMenu : regularNodeMenu,
                        }}
                      >
                        <div className="rounded-md p-1/2 shrink-0 outline outline-stroke-default bg-bg-default hover:bg-bg-hover ">
                          <EllipsisHorizontalIcon className="w-6 h-6 text-text-primary" />
                        </div>
                      </Dropdown>
                    );
                  },
                },
              ]}
              pagination={{
                pageSize: 20,
                hideOnSinglePage: true,
              }}
            />
          </div>
        </Col>
      </Row>

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
      <AddNodeDialog
        networkId={resolvedNetworkId}
        isOpen={isAddNewHostModalOpen}
        onClose={() => setIsAddNewHostModalOpen(false)}
        onCreateClient={() => {
          loadClients();
          store.fetchNodes();
          loadAcls();
        }}
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
      {targetClient && (
        <ClientDetailsModal
          key={`view-client-${targetClient.clientid}`}
          isOpen={isClientDetailsModalOpen}
          client={targetClient}
          onViewConfig={() => setIsClientConfigModalOpen(true)}
          onUpdateClient={(updatedClient: ExternalClient) => {
            setClients((prev) => prev.map((c) => (c.clientid === targetClient.clientid ? updatedClient : c)));
            setTargetClient(updatedClient);
          }}
          onCancel={() => setIsClientDetailsModalOpen(false)}
        />
      )}
      {targetClient && (
        <UpdateClientModal
          key={`update-client-${targetClient.clientid}`}
          isOpen={isUpdateClientModalOpen}
          client={targetClient}
          networkId={resolvedNetworkId}
          onUpdateClient={() => {
            loadClients();
            setIsUpdateClientModalOpen(false);
          }}
          onCancel={() => setIsUpdateClientModalOpen(false)}
        />
      )}
      {selectedGateway && (
        <UpdateIngressModal
          key={`update-ingress-${selectedGateway.id}`}
          isOpen={isUpdateGatewayModalOpen}
          ingress={selectedGateway}
          networkId={resolvedNetworkId}
          onUpdateIngress={(newNode) => {
            setIsUpdateGatewayModalOpen(false);
            setSelectedGateway(newNode);
          }}
          onCancel={() => setIsUpdateGatewayModalOpen(false)}
        />
      )}
    </PageLayout>
  );
}
