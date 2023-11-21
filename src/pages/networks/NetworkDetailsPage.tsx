import AddClientModal from '@/components/modals/add-client-modal/AddClientModal';
import AddDnsModal from '@/components/modals/add-dns-modal/AddDnsModal';
import AddEgressModal from '@/components/modals/add-egress-modal/AddEgressModal';
import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import ClientDetailsModal from '@/components/modals/client-detaiils-modal/ClientDetailsModal';
import UpdateEgressModal from '@/components/modals/update-egress-modal/UpdateEgressModal';
import { ACL_ALLOWED, ACL_DENIED, AclStatus, NodeAcl, NodeAclContainer } from '@/models/Acl';
import { DNS } from '@/models/Dns';
import { ExtClientAcls, ExternalClient } from '@/models/ExternalClient';
import { Host } from '@/models/Host';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { AppRoutes } from '@/routes';
import { HostsService } from '@/services/HostsService';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';
import { getNetworkHostRoute, resolveAppRoute } from '@/utils/RouteUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import {
  CheckOutlined,
  DashOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  // DownloadOutlined,
  ExclamationCircleFilled,
  LoadingOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  Layout,
  MenuProps,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  TableColumnProps,
  Tabs,
  TabsProps,
  Tag,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageProps } from '../../models/Page';
import '@react-sigma/core/lib/react-sigma.min.css';
import './NetworkDetailsPage.scss';
import { ControlsContainer, FullScreenControl, SearchControl, SigmaContainer, ZoomControl } from '@react-sigma/core';
import NetworkGraph from '@/components/NetworkGraph';
import UpdateRelayModal from '@/components/modals/update-relay-modal/UpdateRelayModal';
import { MetricCategories, NetworkMetrics, NodeOrClientMetric, UptimeNodeMetrics } from '@/models/Metrics';
import { getExtClientAclStatus, getHostHealth, renderMetricValue, useBranding } from '@/utils/Utils';
import AddHostsToNetworkModal from '@/components/modals/add-hosts-to-network-modal/AddHostsToNetworkModal';
import NewHostModal from '@/components/modals/new-host-modal/NewHostModal';
import AddIngressModal from '@/components/modals/add-ingress-modal/AddIngressModal';
import UpdateIngressModal from '@/components/modals/update-ingress-modal/UpdateIngressModal';
import UpdateClientModal from '@/components/modals/update-client-modal/UpdateClientModal';
import { NULL_HOST, NULL_NODE } from '@/constants/Types';
import UpdateNodeModal from '@/components/modals/update-node-modal/UpdateNodeModal';
import VirtualisedTable from '@/components/VirtualisedTable';
import { NETWORK_GRAPH_SIGMA_CONTAINER_ID } from '@/constants/AppConstants';
import UpdateIngressUsersModal from '@/components/modals/update-ingress-users-modal/UpdateIngressUsersModal';

interface ExternalRoutesTableData {
  node: ExtendedNode;
  range: Node['egressgatewayranges'][0];
}

interface AclTableData {
  type: 'node' | 'client';
  nodeOrClientId: Node['id'] | ExternalClient['clientid'];
  name: Host['name'] | ExternalClient['clientid'];
  acls?: NodeAcl;
  clientAcls?: ExtClientAcls;
}

interface NodeMetricsTableData {
  nodeId: Node['id'];
  nodeName: ExtendedNode['name'];
  connectivity?: {
    [nodeId: string]: boolean;
  };
  latency?: {
    [nodeId: string]: number;
  };
  bytesSent?: {
    [nodeId: string]: number;
  };
  bytesReceived?: {
    [nodeId: string]: number;
  };
  uptime?: {
    [nodeId: string]: UptimeNodeMetrics;
  };
}

export default function NetworkDetailsPage(props: PageProps) {
  const { networkId } = useParams<{ networkId: string }>();
  const store = useStore();
  const navigate = useNavigate();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const branding = useBranding();

  const storeFetchNodes = store.fetchNodes;
  const storeDeleteNode = store.deleteNode;
  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [form] = Form.useForm<Network>();
  const isIpv4Watch = Form.useWatch('isipv4', form);
  const isIpv6Watch = Form.useWatch('isipv6', form);
  const [network, setNetwork] = useState<Network | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingNetwork, setIsEditingNetwork] = useState(false);
  const [searchHost, setSearchHost] = useState('');
  const [searchDns, setSearchDns] = useState('');
  const [dnses, setDnses] = useState<DNS[]>([]);
  const [isAddDnsModalOpen, setIsAddDnsModalOpen] = useState(false);
  const [nodeAcls, setNodeAcls] = useState<NodeAclContainer>({});
  const [originalNodeAcls, setOriginalNodeAcls] = useState<NodeAclContainer>({});
  const [clientAcls, setClientAcls] = useState<Record<ExternalClient['clientid'], ExtClientAcls>>({});
  const [originalClientAcls, setOriginalClientAcls] = useState<Record<ExternalClient['clientid'], ExtClientAcls>>({});
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [targetClient, setTargetClient] = useState<ExternalClient | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<Node | null>(null);
  const [searchClientGateways, setSearchClientGateways] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [filteredEgress, setFilteredEgress] = useState<Node | null>(null);
  const [isAddEgressModalOpen, setIsAddEgressModalOpen] = useState(false);
  const [searchEgress, setSearchEgress] = useState('');
  const [isUpdateEgressModalOpen, setIsUpdateEgressModalOpen] = useState(false);
  const [selectedRelay, setSelectedRelay] = useState<ExtendedNode | null>(null);
  const [isAddRelayModalOpen, setIsAddRelayModalOpen] = useState(false);
  const [searchRelay, setSearchRelay] = useState('');
  const [isUpdateRelayModalOpen, setIsUpdateRelayModalOpen] = useState(false);
  const [searchAclHost, setSearchAclHost] = useState('');
  // const [isDownloadingMetrics, setIsDownloadingMetrics] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<MetricCategories>('connectivity-status');
  const [networkNodeMetrics, setNetworkNodeMetrics] = useState<NetworkMetrics | null>(null);
  const [clientMetrics, setClientMetrics] = useState<Record<ExternalClient['clientid'], NodeOrClientMetric> | null>(
    null,
  );
  const [filteredMetricNodeId, setFilteredMetricNodeId] = useState<Node['id'] | null>(null);
  const [isAddHostsToNetworkModalOpen, setIsAddHostsToNetworkModalOpen] = useState(false);
  const [isAddNewHostModalOpen, setIsAddNewHostModalOpen] = useState(false);
  const [isAddClientGatewayModalOpen, setIsAddClientGatewayModalOpen] = useState(false);
  const [isUpdateGatewayModalOpen, setIsUpdateGatewayModalOpen] = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);
  const [isUpdateNodeModalOpen, setIsUpdateNodeModalOpen] = useState(false);
  const [isUpdateIngressUsersModalOpen, setIsUpdateIngressUsersModalOpen] = useState(false);
  const [targetNode, setTargetNode] = useState<Node | null>(null);
  const [showClientAcls, setShowClientAcls] = useState(false);
  const [isSubmittingAcls, setIsSubmittingAcls] = useState(false);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === networkId)
        .filter((node) => `${node?.name ?? ''}${node.address}`.toLowerCase().includes(searchHost.toLowerCase())),
    [store.nodes, store.hostsCommonDetails, networkId, searchHost],
  );

  const clientGateways = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isingressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const filteredClientGateways = useMemo<ExtendedNode[]>(
    () =>
      clientGateways.filter((node) => node.name?.toLowerCase().includes(searchClientGateways.toLowerCase()) ?? false),
    [clientGateways, searchClientGateways],
  );

  const filteredClients = useMemo<ExternalClient[]>(
    () =>
      clients
        .filter((client) => {
          if (selectedGateway) {
            return client.ingressgatewayid === selectedGateway.id;
          }
          const filteredGatewayIds = filteredClientGateways.map((node) => node.id);
          return filteredGatewayIds.includes(client.ingressgatewayid);
        })
        .filter((client) => client.clientid?.toLowerCase().includes(searchClients.toLowerCase()) ?? false)
        .sort((a, b) => a.ingressgatewayid.localeCompare(b.ingressgatewayid)),
    [clients, filteredClientGateways, searchClients, selectedGateway],
  );

  const egresses = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isegressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const filteredEgresses = useMemo<ExtendedNode[]>(
    () => egresses.filter((egress) => egress.name?.toLowerCase().includes(searchEgress.toLowerCase()) ?? false),
    [egresses, searchEgress],
  );

  const filteredExternalRoutes = useMemo<ExternalRoutesTableData[]>(() => {
    if (filteredEgress) {
      return filteredEgress.egressgatewayranges.map((range) => ({
        node: getExtendedNode(filteredEgress, store.hostsCommonDetails),
        range,
      }));
    } else {
      return filteredEgresses
        .flatMap((e) => e.egressgatewayranges.map((range) => ({ node: e, range })))
        .sort((a, b) => a.node.id.localeCompare(b.node.id));
    }
  }, [filteredEgress, filteredEgresses, store.hostsCommonDetails]);

  const networkHosts = useMemo(() => {
    const hostsMap = new Map<Host['id'], Host>();
    store.hosts.forEach((host) => {
      hostsMap.set(host.id, host);
    });
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => hostsMap.get(node.hostid) ?? NULL_HOST);
  }, [networkId, store.hosts, store.nodes]);

  const relays = useMemo<ExtendedNode[]>(() => {
    if (!isServerEE) {
      return [];
    }
    return networkNodes.filter((node) => isNodeRelay(node));
  }, [networkNodes, isServerEE]);

  const filteredRelays = useMemo<ExtendedNode[]>(
    () => relays.filter((relay) => relay.name?.toLowerCase().includes(searchRelay.toLowerCase()) ?? false),
    [relays, searchRelay],
  );

  const filteredRelayedNodes = useMemo<ExtendedNode[]>(() => {
    if (selectedRelay) {
      return networkNodes.filter((node) => node.relayedby === selectedRelay.id);
    } else {
      return networkNodes.filter((node) => node.relayedby).sort((a, b) => a.relayedby.localeCompare(b.relayedby));
    }
  }, [networkNodes, selectedRelay]);

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

  const networkAcls = useMemo(() => {
    const networkAcls: NodeAclContainer = {};
    const networkNodesMap = new Map<Node['id'], boolean>();
    networkNodes.forEach((node) => {
      networkNodesMap.set(node.id, true);
    });
    Object.keys(nodeAcls).forEach((nodeId) => {
      if (networkNodesMap.has(nodeId)) {
        networkAcls[nodeId] = nodeAcls[nodeId];
      }
    });
    return networkAcls;
  }, [nodeAcls, networkNodes]);

  const aclTableData = useMemo<AclTableData[]>(() => {
    // node acls
    const aclDataPerNode: AclTableData[] = networkNodes
      .map((node) => getExtendedNode(node, store.hostsCommonDetails))
      .map((node) => ({
        type: 'node',
        nodeOrClientId: node.id,
        name: node?.name ?? '',
        acls: networkAcls[node.id],
      }));

    // client acls
    if (showClientAcls) {
      clients.forEach((client) => {
        aclDataPerNode.push({
          type: 'client',
          nodeOrClientId: client.clientid,
          name: client.clientid,
          clientAcls: clientAcls[client.clientid],
        });
      });
    }

    aclDataPerNode.sort((a, b) => a?.name?.localeCompare(b?.name ?? '') ?? 0);
    return aclDataPerNode;
  }, [clientAcls, clients, networkAcls, networkNodes, showClientAcls, store.hostsCommonDetails]);

  const filteredAclData = useMemo<AclTableData[]>(() => {
    return aclTableData.filter((node) => node.name.toLowerCase().includes(searchAclHost.toLowerCase()));
  }, [aclTableData, searchAclHost]);

  const connectivityStatusMetricsData = useMemo<NodeMetricsTableData[]>(() => {
    return Object.keys(networkNodeMetrics?.nodes ?? {}).map((nodeId) => {
      const nodeConnectivityMap = networkNodeMetrics?.nodes[nodeId].connectivity;
      const res = {
        nodeId: nodeId,
        nodeName: networkNodeMetrics?.nodes[nodeId].node_name ?? '',
        connectivity: {} as NodeMetricsTableData['connectivity'],
      };
      Object.keys(nodeConnectivityMap ?? {}).reduce((acc, key) => {
        acc.connectivity![key] = nodeConnectivityMap?.[key].connected ?? false;
        return acc;
      }, res);
      return res;
    });
  }, [networkNodeMetrics?.nodes]);

  const latencyMetricsData = useMemo<NodeMetricsTableData[]>(() => {
    return Object.keys(networkNodeMetrics?.nodes ?? {}).map((nodeId) => {
      const nodeConnectivityMap = networkNodeMetrics?.nodes[nodeId].connectivity;
      const res = {
        nodeId: nodeId,
        nodeName: networkNodeMetrics?.nodes[nodeId].node_name ?? '',
        latency: {} as NodeMetricsTableData['latency'],
      };
      Object.keys(nodeConnectivityMap ?? {}).reduce((acc, key) => {
        acc.latency![key] = nodeConnectivityMap?.[key].latency ?? 0;
        return acc;
      }, res);
      return res;
    });
  }, [networkNodeMetrics?.nodes]);

  const bytesSentMetricsData = useMemo<NodeMetricsTableData[]>(() => {
    return Object.keys(networkNodeMetrics?.nodes ?? {}).map((nodeId) => {
      const nodeConnectivityMap = networkNodeMetrics?.nodes[nodeId].connectivity;
      const res = {
        nodeId: nodeId,
        nodeName: networkNodeMetrics?.nodes[nodeId].node_name ?? '',
        bytesSent: {} as NodeMetricsTableData['bytesSent'],
      };
      Object.keys(nodeConnectivityMap ?? {}).reduce((acc, key) => {
        acc.bytesSent![key] = nodeConnectivityMap?.[key].totalsent ?? 0;
        return acc;
      }, res);
      return res;
    });
  }, [networkNodeMetrics?.nodes]);

  const bytesReceivedMetricsData = useMemo<NodeMetricsTableData[]>(() => {
    return Object.keys(networkNodeMetrics?.nodes ?? {}).map((nodeId) => {
      const nodeConnectivityMap = networkNodeMetrics?.nodes[nodeId].connectivity;
      const res = {
        nodeId: nodeId,
        nodeName: networkNodeMetrics?.nodes[nodeId].node_name ?? '',
        bytesReceived: {} as NodeMetricsTableData['bytesReceived'],
      };
      Object.keys(nodeConnectivityMap ?? {}).reduce((acc, key) => {
        acc.bytesReceived![key] = nodeConnectivityMap?.[key].totalreceived ?? 0;
        return acc;
      }, res);
      return res;
    });
  }, [networkNodeMetrics?.nodes]);

  const uptimeMetricsData = useMemo<NodeMetricsTableData[]>(() => {
    return Object.keys(networkNodeMetrics?.nodes ?? {}).map((nodeId) => {
      const nodeConnectivityMap = networkNodeMetrics?.nodes[nodeId].connectivity;
      const res = {
        nodeId: nodeId,
        nodeName: networkNodeMetrics?.nodes[nodeId].node_name ?? '',
        uptime: {} as NodeMetricsTableData['uptime'],
      };
      Object.keys(nodeConnectivityMap ?? {}).reduce((acc, key) => {
        acc.uptime![key] = {
          fractionalUptime: nodeConnectivityMap?.[key].uptime ?? 0,
          totalFractionalUptime: nodeConnectivityMap?.[key].totaltime ?? 0,
          uptime: nodeConnectivityMap?.[key].actualuptime ?? 0,
          uptimePercent: nodeConnectivityMap?.[key].percentup.toFixed(2) ?? 0,
        };
        return acc;
      }, res);
      return res;
    });
  }, [networkNodeMetrics?.nodes]);

  const clientsMetricsData = useMemo<NodeOrClientMetric[]>(() => {
    return Object.values(clientMetrics ?? {});
  }, [clientMetrics]);

  const loadAcls = useCallback(async () => {
    try {
      if (!networkId) return;
      const acls = (await NetworksService.getAcls(networkId)).data;
      setNodeAcls(acls);
      setOriginalNodeAcls(acls);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Error loading ACLs',
          description: extractErrorMsg(err),
        });
      }
    }
  }, [networkId, notify]);

  const editNode = useCallback((node: Node) => {
    setTargetNode(node);
    setIsUpdateNodeModalOpen(true);
  }, []);

  // const downloadMetrics = useCallback(() => {}, []);

  const loadClients = useCallback(async () => {
    try {
      if (!networkId) return;
      const networkClients = (await NodesService.getNetworkExternalClients(networkId)).data ?? [];
      setClients(networkClients);
      const clientAclsContainer = {} as Record<ExternalClient['clientid'], ExtClientAcls>;
      networkClients.forEach((client) => {
        clientAclsContainer[client.clientid] = client.deniednodeacls ?? {};
      });
      setOriginalClientAcls(clientAclsContainer);
      setClientAcls(clientAclsContainer);
    } catch (err) {
      notify.error({
        message: 'Error loading clients',
        description: extractErrorMsg(err as any),
      });
    }
  }, [networkId, notify]);

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
          } catch (err) {
            notify.error({
              message: 'Error deleting Client',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, storeFetchNodes],
  );

  const openClientDetails = useCallback((client: ExternalClient) => {
    setTargetClient(client);
    setIsClientDetailsModalOpen(true);
  }, []);

  const confirmDeleteGateway = useCallback(
    (gateway: Node) => {
      Modal.confirm({
        title: `Delete gateway ${getExtendedNode(gateway, store.hostsCommonDetails).name}`,
        content: `Are you sure you want to delete this gateway?`,
        onOk: async () => {
          try {
            await NodesService.deleteIngressNode(gateway.id, gateway.network);
            storeFetchNodes();
            loadClients();
            notify.success({ message: 'Gateway deleted' });
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting gateway',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [loadClients, notify, store.hostsCommonDetails, storeFetchNodes],
  );

  const confirmDeleteEgress = useCallback(
    (egress: Node) => {
      Modal.confirm({
        title: `Delete egress ${getExtendedNode(egress, store.hostsCommonDetails).name}`,
        content: `Are you sure you want to delete this egress?`,
        onOk: async () => {
          try {
            await NodesService.deleteEgressNode(egress.id, egress.network);
            storeFetchNodes();
            notify.success({ message: 'Egress deleted' });
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting egress',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify, store.hostsCommonDetails, storeFetchNodes],
  );

  const confirmDeleteRange = useCallback(
    (range: ExternalRoutesTableData) => {
      Modal.confirm({
        title: `Delete range ${range.range} from ${range.node?.name ?? ''}`,
        content: `Are you sure you want to delete this external range?`,
        onOk: async () => {
          try {
            if (!networkId) return;
            const newRanges = new Set(range.node.egressgatewayranges);
            const natEnabled = range.node.egressgatewaynatenabled;
            newRanges.delete(range.range);
            await NodesService.deleteEgressNode(range.node.id, networkId);
            if (newRanges.size > 0) {
              await NodesService.createEgressNode(range.node.id, networkId, {
                ranges: [...newRanges],
                natEnabled: natEnabled ? 'yes' : 'no',
              });
            }
            store.fetchNodes();
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting range',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [networkId, notify, store],
  );

  const confirmDeleteDns = useCallback(
    (dns: DNS) => {
      Modal.confirm({
        title: `Delete DNS ${dns.name}.${dns.network}`,
        content: `Are you sure you want to delete this DNS?`,
        onOk: async () => {
          try {
            await NetworksService.deleteDns(dns.network, dns.name);
            setDnses((dnses) => dnses.filter((d) => d.name !== dns.name));
            notify.success({ message: 'DNS deleted' });
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting DNS',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify],
  );

  const confirmDeleteRelay = useCallback(
    (relay: ExtendedNode) => {
      if (!networkId) return;

      Modal.confirm({
        title: `Delete relay ${relay.name}`,
        content: `Are you sure you want to delete this relay?`,
        onOk: async () => {
          try {
            await NodesService.deleteRelay(relay.id, networkId);
            store.fetchNodes();
            notify.success({ message: 'Relay deleted' });
          } catch (err) {
            notify.error({
              message: 'Error deleting relay',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, store, networkId],
  );

  const confirmRemoveRelayed = useCallback(
    (relayed: ExtendedNode, relay: ExtendedNode) => {
      if (!networkId) return;

      Modal.confirm({
        title: `Stop ${relayed.name} from being relayed by ${relay.name}`,
        content: `Are you sure you want to stop this host from being relayed?`,
        onOk: async () => {
          try {
            const relayedIds = new Set([...(relay.relaynodes ?? [])]);
            relayedIds.delete(relayed.id);

            if (relayedIds.size > 0) {
              await NodesService.updateNode(relay.id, networkId, { ...relay, relaynodes: [...relayedIds] });
            } else {
              (await NodesService.deleteRelay(relay.id, networkId)).data;
            }

            storeFetchNodes();
          } catch (err) {
            notify.error({
              message: 'Error updating relay',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkId, notify, storeFetchNodes],
  );

  const getGatewayDropdownOptions = useCallback(
    (gateway: Node) => {
      const defaultOptions: MenuProps['items'] = [
        {
          key: 'edit',
          label: (
            <Typography.Text
              onClick={() => {
                setSelectedGateway(gateway);
                setIsUpdateGatewayModalOpen(true);
              }}
            >
              <EditOutlined /> Edit
            </Typography.Text>
          ),
          onClick: (info: any) => {
            info.domEvent.stopPropagation();
          },
        },
        {
          key: 'delete',
          label: (
            <Typography.Text onClick={() => confirmDeleteGateway(gateway)}>
              <DeleteOutlined /> Delete
            </Typography.Text>
          ),
          onClick: (info: any) => {
            info.domEvent.stopPropagation();
          },
        },
      ];

      if (isServerEE) {
        const addRemoveUsersOption: MenuProps['items'] = [
          {
            key: 'addremove',
            label: (
              <Typography.Text
                onClick={() => {
                  setSelectedGateway(gateway);
                  setIsUpdateIngressUsersModalOpen(true);
                }}
              >
                <UserOutlined /> Add / Remove Users
              </Typography.Text>
            ),
            onClick: (info) => {
              info.domEvent.stopPropagation();
            },
          },
        ];
        return [...addRemoveUsersOption, ...defaultOptions];
      }

      return defaultOptions;
    },
    [confirmDeleteGateway, isServerEE],
  );

  const gatewaysTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
        // width: 500,
        render(name) {
          return <Typography.Link>{name}</Typography.Link>;
        },
        sorter: (a, b) => a.name?.localeCompare(b.name ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, node) {
          const addrs = `${node.address}, ${node.address6}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
      },
      {
        title: 'Default Client DNS',
        dataIndex: 'ingressdns',
      },
      {
        render(_, gateway) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: getGatewayDropdownOptions(gateway),
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [getGatewayDropdownOptions],
  );

  const egressTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
        width: 500,
        render(name) {
          return <Typography.Link>{name}</Typography.Link>;
        },
        sorter: (a, b) => a.name?.localeCompare(b.name ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, node) {
          const addrs = `${node.address}, ${node.address6}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
      },
      {
        width: '1rem',
        render(_, egress) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'update',
                    label: (
                      <Typography.Text
                        onClick={() => {
                          setFilteredEgress(egress);
                          setIsUpdateEgressModalOpen(true);
                        }}
                      >
                        <EditOutlined /> Update
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                    },
                  },
                  {
                    key: 'delete',
                    label: (
                      <Typography.Text onClick={() => confirmDeleteEgress(egress)}>
                        <DeleteOutlined /> Delete
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                    },
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
    [confirmDeleteEgress],
  );

  const externalRoutesTableCols = useMemo<TableColumnProps<ExternalRoutesTableData>[]>(() => {
    return [
      {
        title: 'CIDR',
        dataIndex: 'range',
      },
      {
        title: 'Host',
        render(_, range) {
          return range.node?.name ?? '';
        },
      },
      {
        width: '1rem',
        render(_, range) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'delete',
                    label: (
                      <Typography.Text onClick={() => confirmDeleteRange(range)}>
                        <DeleteOutlined /> Delete
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
    ];
  }, [confirmDeleteRange]);

  const clientsTableCols = useMemo<TableColumnProps<ExternalClient>[]>(
    () => [
      {
        title: 'Client ID',
        dataIndex: 'clientid',
        width: 500,
        render(value, client) {
          return <Typography.Link onClick={() => openClientDetails(client)}>{value}</Typography.Link>;
        },
      },
      {
        title: 'Owner ID',
        dataIndex: 'ownerid',
        width: 500,
        render(value) {
          return <Typography.Text>{value || 'n/a'}</Typography.Text>;
        },
      },
      {
        title: 'Allowed IPs',
        render(_, client) {
          const addrs = `${client.address}, ${client.address6}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      // {
      //   title: 'Public Key',
      //   dataIndex: 'publickey',
      //   width: 200,
      //   render(value) {
      //     return (
      //       <div style={{ width: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      //         {value}
      //       </div>
      //     );
      //   },
      // },
      {
        title: 'Gateway',
        width: 200,
        render(_, client) {
          const assocIngress = networkNodes.find((node) => node.id === client.ingressgatewayid);
          return assocIngress ? getExtendedNode(assocIngress, store.hostsCommonDetails).name ?? '' : '';
        },
      },
      {
        title: 'Enabled',
        dataIndex: 'enabled',
        render(value, client) {
          return (
            <Switch
              checked={value}
              onChange={(checked) => {
                toggleClientStatus(client, checked);
              }}
            />
          );
        },
      },
      {
        render(_, client) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: (
                      <Typography.Text
                        onClick={() => {
                          setTargetClient(client);
                          setIsUpdateClientModalOpen(true);
                        }}
                      >
                        <EditOutlined /> Edit
                      </Typography.Text>
                    ),
                  },
                  {
                    key: 'delete',
                    label: (
                      <Typography.Text onClick={() => confirmDeleteClient(client)}>
                        <DeleteOutlined /> Delete
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
    [confirmDeleteClient, networkNodes, openClientDetails, store.hostsCommonDetails, toggleClientStatus],
  );

  const relayTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
        sorter: (a, b) => a.name?.localeCompare(b.name ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, node) {
          const addrs = `${node.address ?? ''}, ${node.address6 ?? ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        width: '1rem',
        render(_, relay) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'update',
                    label: (
                      <Typography.Text
                        onClick={() => {
                          setSelectedRelay(relay);
                          setIsUpdateRelayModalOpen(true);
                        }}
                      >
                        <EditOutlined /> Update
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                    },
                  },
                  {
                    key: 'delete',
                    label: (
                      <Typography.Text onClick={() => confirmDeleteRelay(relay)}>
                        <DeleteOutlined /> Delete
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                    },
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
    [confirmDeleteRelay],
  );

  const relayedTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
      },
      {
        title: 'Relayed by',
        render(_, node) {
          return `${networkNodes.find((n) => n.id === node.relayedby)?.name ?? ''}`;
        },
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, node) {
          const addrs = `${node.address ?? ''}, ${node.address6 ?? ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        width: '1rem',
        render(_, relayed) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'delete',
                    label: (
                      <Typography.Text
                        onClick={() =>
                          confirmRemoveRelayed(
                            relayed,
                            networkNodes.find((node) => node.id === relayed.relayedby) ?? NULL_NODE,
                          )
                        }
                      >
                        <DeleteOutlined /> Stop being relayed
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                    },
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
    [confirmRemoveRelayed, networkNodes],
  );

  const aclTableCols = useMemo<TableColumnProps<AclTableData>[]>(() => {
    const aclTableDataMap = new Map<Node['id'] | ExternalClient['clientid'], AclTableData>();
    aclTableData.forEach((aclData) => aclTableDataMap.set(aclData.nodeOrClientId, aclData));

    const renderAclValue = (
      rowColTypeTuple: [rowType: 'node' | 'client', colType: 'node' | 'client'],
      originalAclLevel: AclStatus,
      newAclLevel: AclStatus,
      nodeOrClientIdRow: Node['id'] | ExternalClient['clientid'],
      nodeOrClientIdCol: Node['id'] | ExternalClient['clientid'],
    ) => {
      const type = rowColTypeTuple.some((t) => t === 'client') ? 'client' : 'node';
      if (type === 'node') {
        switch (newAclLevel) {
          case ACL_DENIED:
            return (
              <Badge size="small" dot={originalAclLevel !== newAclLevel}>
                <Button
                  danger
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => {
                    setNodeAcls((prevAcls) => {
                      const newAcls = structuredClone(prevAcls);
                      newAcls[nodeOrClientIdRow][nodeOrClientIdCol] = 2;
                      newAcls[nodeOrClientIdCol][nodeOrClientIdRow] = 2;
                      return newAcls;
                    });
                  }}
                />
              </Badge>
            );
          case ACL_ALLOWED:
            return (
              <Badge size="small" dot={originalAclLevel !== newAclLevel}>
                <Button
                  size="small"
                  style={{ color: '#3C8618', borderColor: '#274916' }}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setNodeAcls((prevAcls) => {
                      const newAcls = structuredClone(prevAcls);
                      newAcls[nodeOrClientIdRow][nodeOrClientIdCol] = 1;
                      newAcls[nodeOrClientIdCol][nodeOrClientIdRow] = 1;
                      return newAcls;
                    });
                  }}
                />
              </Badge>
            );
          default:
            return <DashOutlined />;
        }
      } else {
        if (rowColTypeTuple[1] === 'node') {
          return <DashOutlined />;
        }
        // TODO: optimise this bit of logic to prevent O^2. maybe refactor
        const assocClient = clients.find((c) => c.clientid === nodeOrClientIdCol);
        const assocIngress = networkNodes.find((n) => n.id === assocClient?.ingressgatewayid);
        const assocIngressDenyList = Object.keys(nodeAcls[assocIngress?.id ?? ''] ?? {}).filter(
          (targetNodeId) => nodeAcls[assocIngress?.id ?? ''][targetNodeId] === ACL_DENIED,
        );
        if (assocIngressDenyList.includes(nodeOrClientIdRow)) {
          return (
            <Badge size="small" dot={originalAclLevel !== newAclLevel}>
              <Button
                danger
                disabled
                title={`The associated ingress gateway (${
                  assocIngress?.name ?? ''
                }) has denied this client access to this node.`}
                size="small"
                icon={<StopOutlined />}
              />
            </Badge>
          );
        }
        switch (newAclLevel) {
          case ACL_DENIED:
            return (
              <Badge size="small" dot={originalAclLevel !== newAclLevel}>
                <Button
                  danger
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => {
                    setClientAcls((prevClientAcls) => {
                      const newClientAcls = structuredClone(prevClientAcls);
                      // this check is because client acl data structure is not interchangeable an in that of nodes
                      // this manipulation leads to "dirty data."
                      // ie: clientAcls gets populated with node IDs as if they are clients
                      // can be improved but doesnt matter at the moment as it would be ignored when sending to the server
                      if (newClientAcls[nodeOrClientIdRow]) {
                        delete newClientAcls[nodeOrClientIdRow][nodeOrClientIdCol];
                        if (newClientAcls[nodeOrClientIdCol]) {
                          delete newClientAcls[nodeOrClientIdRow][nodeOrClientIdCol];
                        }
                      }
                      if (newClientAcls[nodeOrClientIdCol]) {
                        delete newClientAcls[nodeOrClientIdCol][nodeOrClientIdRow];
                        if (newClientAcls[nodeOrClientIdRow]) {
                          delete newClientAcls[nodeOrClientIdCol][nodeOrClientIdRow];
                        }
                      }
                      return newClientAcls;
                    });
                  }}
                />
              </Badge>
            );
          case ACL_ALLOWED:
            return (
              <Badge size="small" dot={originalAclLevel !== newAclLevel}>
                <Button
                  size="small"
                  style={{ color: '#3C8618', borderColor: '#274916' }}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setClientAcls((prevClientAcls) => {
                      const newClientAcls = structuredClone(prevClientAcls);
                      // this check is because client acl data structure is not interchangeable an in that of nodes
                      // this manipulation leads to "dirty data."
                      // ie: clientAcls gets populated with node IDs as if they are clients
                      // can be improved but doesnt matter at the moment as it would be ignored when sending to the server
                      if (newClientAcls[nodeOrClientIdRow]) {
                        newClientAcls[nodeOrClientIdRow][nodeOrClientIdCol] = {} as never;
                        newClientAcls[nodeOrClientIdCol] = {
                          ...(newClientAcls[nodeOrClientIdCol] ?? {}),
                          [nodeOrClientIdRow]: {} as never,
                        };
                      }
                      if (newClientAcls[nodeOrClientIdCol]) {
                        newClientAcls[nodeOrClientIdCol][nodeOrClientIdRow] = {} as never;
                        newClientAcls[nodeOrClientIdRow] = {
                          ...(newClientAcls[nodeOrClientIdRow] ?? {}),
                          [nodeOrClientIdCol]: {} as never,
                        };
                      }
                      return newClientAcls;
                    });
                  }}
                />
              </Badge>
            );
          default:
            return <DashOutlined />;
        }
      }
    };

    return [
      {
        width: '5rem',
        fixed: 'left',
        render(_, entry) {
          return (
            <Typography.Text
              style={{
                width: '5rem',
                wordBreak: 'keep-all',
              }}
              onClick={() => setSearchAclHost(entry.name)}
            >
              {entry.name}
            </Typography.Text>
          );
        },
      },
      ...aclTableData.map((aclData) => ({
        title: aclData.name,
        width: '5rem',
        render(_: unknown, aclEntry: (typeof aclTableData)[0]) {
          // aclData => column, aclEntry => row
          const aclType = [aclData.type, aclEntry.type].some((t) => t === 'client') ? 'client' : 'node';

          return renderAclValue(
            // row/col type tuple
            [aclEntry.type, aclData.type],
            // original acl status
            aclType === 'node'
              ? originalNodeAcls?.[aclEntry.nodeOrClientId]?.[aclData.nodeOrClientId] ?? 0
              : getExtClientAclStatus(aclEntry.nodeOrClientId, originalClientAcls[aclData.nodeOrClientId] ?? {}),
            // new acl status
            aclType === 'node'
              ? aclTableDataMap.get(aclEntry.nodeOrClientId)?.acls?.[aclData?.nodeOrClientId] ?? 0
              : aclEntry.nodeOrClientId === aclData.nodeOrClientId // check disable toggling ones own self
              ? 0
              : getExtClientAclStatus(
                  aclEntry.nodeOrClientId,
                  aclTableDataMap.get(aclData.nodeOrClientId)?.clientAcls ?? {},
                ),
            // node or client IDs
            aclEntry.nodeOrClientId,
            aclData.nodeOrClientId,
          );
        },
      })),
    ];
  }, [aclTableData, clients, networkNodes, nodeAcls, originalClientAcls, originalNodeAcls]);

  const hasAclsBeenEdited = useMemo(
    () =>
      JSON.stringify(nodeAcls) !== JSON.stringify(originalNodeAcls) ||
      JSON.stringify(clientAcls) !== JSON.stringify(originalClientAcls),
    [clientAcls, nodeAcls, originalClientAcls, originalNodeAcls],
  );

  const metricsTableCols = useMemo<TableColumnProps<NodeMetricsTableData>[]>(() => {
    switch (currentMetric) {
      case 'connectivity-status':
        return [
          {
            title: '',
            width: '5rem',
            fixed: 'left',
            render(_, entry) {
              return (
                <Typography.Text
                  style={{
                    width: '5rem',
                    wordBreak: 'keep-all',
                  }}
                  onClick={() => setFilteredMetricNodeId(entry.nodeId)}
                >
                  {entry.nodeName}
                </Typography.Text>
              );
            },
          },
          ...connectivityStatusMetricsData.map((metricData) => ({
            title: metricData.nodeName,
            render(_: unknown, metricEntry: (typeof connectivityStatusMetricsData)[0]) {
              if (metricEntry.nodeId === metricData.nodeId) {
                return <DashOutlined />;
              }
              return renderMetricValue(currentMetric, metricData?.connectivity?.[metricEntry?.nodeId] ?? false);
            },
          })),
        ];
        break;
      case 'latency':
        return [
          {
            title: '',
            width: '5rem',
            fixed: 'left',
            render(_, entry) {
              return (
                <Typography.Text
                  style={{
                    width: '5rem',
                    wordBreak: 'keep-all',
                  }}
                  onClick={() => setFilteredMetricNodeId(entry.nodeId)}
                >
                  {entry.nodeName}
                </Typography.Text>
              );
            },
          },
          ...latencyMetricsData.map((metricData) => ({
            title: metricData.nodeName,
            render(_: unknown, metricEntry: (typeof latencyMetricsData)[0]) {
              if (metricEntry.nodeId === metricData.nodeId) {
                return <DashOutlined />;
              }
              return renderMetricValue(currentMetric, metricData?.latency?.[metricEntry?.nodeId] ?? 0);
            },
          })),
        ];
        break;
      case 'bytes-sent':
        return [
          {
            title: '',
            width: '5rem',
            fixed: 'left',
            render(_, entry) {
              return (
                <Typography.Text
                  style={{
                    width: '5rem',
                    wordBreak: 'keep-all',
                  }}
                  onClick={() => setFilteredMetricNodeId(entry.nodeId)}
                >
                  {entry.nodeName}
                </Typography.Text>
              );
            },
          },
          ...bytesSentMetricsData.map((metricData) => ({
            title: metricData.nodeName,
            render(_: unknown, metricEntry: (typeof bytesSentMetricsData)[0]) {
              if (metricEntry.nodeId === metricData.nodeId) {
                return <DashOutlined />;
              }
              return renderMetricValue(currentMetric, metricData?.bytesSent?.[metricEntry?.nodeId] ?? 0);
            },
          })),
        ];
        break;
      case 'bytes-received':
        return [
          {
            title: '',
            width: '5rem',
            fixed: 'left',
            render(_, entry) {
              return (
                <Typography.Text
                  style={{
                    width: '5rem',
                    wordBreak: 'keep-all',
                  }}
                  onClick={() => setFilteredMetricNodeId(entry.nodeId)}
                >
                  {entry.nodeName}
                </Typography.Text>
              );
            },
          },
          ...bytesReceivedMetricsData.map((metricData) => ({
            title: metricData.nodeName,
            render(_: unknown, metricEntry: (typeof bytesReceivedMetricsData)[0]) {
              if (metricEntry.nodeId === metricData.nodeId) {
                return <DashOutlined />;
              }
              return renderMetricValue(currentMetric, metricData?.bytesReceived?.[metricEntry?.nodeId] ?? 0);
            },
          })),
        ];
        break;
      case 'uptime':
        return [
          {
            title: '',
            width: '5rem',
            fixed: 'left',
            render(_, entry) {
              return (
                <Typography.Text
                  style={{
                    width: '5rem',
                    wordBreak: 'keep-all',
                  }}
                  onClick={() => setFilteredMetricNodeId(entry.nodeId)}
                >
                  {entry.nodeName}
                </Typography.Text>
              );
            },
          },
          ...uptimeMetricsData.map((metricData) => ({
            title: metricData.nodeName,
            render(_: unknown, metricEntry: (typeof uptimeMetricsData)[0]) {
              if (metricEntry.nodeId === metricData.nodeId) {
                return <DashOutlined />;
              }
              return renderMetricValue(currentMetric, metricData?.uptime?.[metricEntry?.nodeId] ?? {});
            },
          })),
        ];
        break;
      default:
        return [];
    }
  }, [
    bytesReceivedMetricsData,
    bytesSentMetricsData,
    connectivityStatusMetricsData,
    currentMetric,
    latencyMetricsData,
    uptimeMetricsData,
  ]);

  const clientMetricsTableCols = useMemo<TableColumnProps<NodeOrClientMetric>[]>(() => {
    return [
      {
        title: 'Client Name',
        dataIndex: 'node_name',
        width: '5rem',
        fixed: 'left',
      },
      {
        title: 'Connected',
        dataIndex: 'connected',
        render: (val) => renderMetricValue('connectivity-status', val),
      },
      {
        title: 'Uptime',
        dataIndex: 'uptime',
        render: (val, data) => {
          const uptime: UptimeNodeMetrics = {
            uptime: data.actualuptime ?? 0,
            fractionalUptime: data.uptime ?? 0,
            totalFractionalUptime: data.totaltime ?? 0,
            uptimePercent: data?.percentup?.toFixed(2) ?? 0,
          };
          return renderMetricValue('uptime', uptime);
        },
      },
      {
        title: 'Latency',
        render(_, data) {
          return renderMetricValue('latency', data.latency);
        },
      },
      {
        title: 'Total Sent',
        render(_, data) {
          return renderMetricValue('bytes-sent', data.totalsent);
        },
      },
      {
        title: 'Total Received',
        render(_, data) {
          return renderMetricValue('bytes-received', data.totalreceived);
        },
      },
    ];
  }, []);

  const isDefaultDns = useCallback(
    (dns: DNS) => {
      return networkNodes.some((node) => getExtendedNode(node, store.hostsCommonDetails).name === dns.name);
    },
    [networkNodes, store.hostsCommonDetails],
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

  const updateAllClientsAcls = useCallback(async () => {
    // TODO: optimise function or entire client ACL update flow. this wont scale
    if (!networkId || !isServerEE) return;
    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      await NodesService.updateExternalClient(c.clientid, networkId, {
        ...c,
        deniednodeacls: clientAcls[c.clientid] ?? {},
      });
    }
    loadClients();
  }, [clientAcls, clients, isServerEE, loadClients, networkId]);

  // ui components
  const getOverviewContent = useCallback(() => {
    if (!network) return <Skeleton active />;
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card style={{ width: '50%' }}>
          <Form
            name="network-details-form"
            form={form}
            layout="vertical"
            initialValues={network}
            disabled={!isEditingNetwork}
          >
            <Form.Item
              label="Network name"
              name="netid"
              rules={[{ required: true }]}
              data-nmui-intercom="network-details-form_netid"
            >
              <Input placeholder="Network name" disabled />
            </Form.Item>

            {/* ipv4 */}
            <Row
              style={{
                border: `1px solid ${themeToken.colorBorder}`,
                borderRadius: '8px',
                padding: '.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Col xs={24}>
                <Row justify="space-between" style={{ marginBottom: isIpv4Watch ? '.5rem' : '0px' }}>
                  <Col>IPv4</Col>
                  <Col>
                    <Form.Item
                      name="isipv4"
                      valuePropName="checked"
                      style={{ marginBottom: '0px' }}
                      data-nmui-intercom="network-details-form_isipv4"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                {isIpv4Watch && (
                  <Row>
                    <Col xs={24}>
                      <Form.Item
                        name="addressrange"
                        style={{ marginBottom: '0px' }}
                        data-nmui-intercom="network-details-form_addressrange"
                      >
                        <Input placeholder="Enter address CIDR (eg: 192.168.1.0/24)" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </Col>
            </Row>

            {/* ipv6 */}
            <Row
              style={{
                border: `1px solid ${themeToken.colorBorder}`,
                borderRadius: '8px',
                padding: '.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Col xs={24}>
                <Row justify="space-between" style={{ marginBottom: isIpv6Watch ? '.5rem' : '0px' }}>
                  <Col>IPv6</Col>
                  <Col>
                    <Form.Item
                      name="isipv6"
                      valuePropName="checked"
                      style={{ marginBottom: '0px' }}
                      data-nmui-intercom="network-details-form_isipv6"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                {isIpv6Watch && (
                  <Row>
                    <Col xs={24}>
                      <Form.Item
                        name="addressrange6"
                        style={{ marginBottom: '0px' }}
                        data-nmui-intercom="network-details-form_addressrange6"
                      >
                        <Input placeholder="Enter address CIDR (eg: 2002::1234:abcd:ffff:c0a8:101/64)" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </Col>
            </Row>

            <Row
              style={{
                border: `1px solid ${themeToken.colorBorder}`,
                borderRadius: '8px',
                padding: '.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Col xs={24}>
                <Row justify="space-between">
                  <Col>Default Access Control</Col>
                  <Col xs={8}>
                    <Form.Item
                      name="defaultacl"
                      style={{ marginBottom: '0px' }}
                      rules={[{ required: true }]}
                      data-nmui-intercom="network-details-form_defaultacl"
                    >
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        options={[
                          { label: 'ALLOW', value: 'yes' },
                          { label: 'DENY', value: 'no' },
                        ]}
                      ></Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>
    );
  }, [network, form, isEditingNetwork, themeToken.colorBorder, isIpv4Watch, isIpv6Watch]);

  const getHostsContent = useCallback(() => {
    return (
      <div className="network-hosts-tab-content" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row justify="space-between" style={{ marginBottom: '1rem', width: '100%' }}>
          <Col xs={12} md={8}>
            <Input
              size="large"
              placeholder="Search hosts"
              value={searchHost}
              onChange={(ev) => setSearchHost(ev.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'right' }}>
            <Dropdown.Button
              type="primary"
              style={{ justifyContent: 'end' }}
              icon={<DownOutlined />}
              menu={{
                items: [
                  {
                    key: 'existing-host',
                    label: 'Add Existing Host',
                    onClick() {
                      setIsAddHostsToNetworkModalOpen(true);
                    },
                  },
                ],
              }}
              onClick={() => setIsAddNewHostModalOpen(true)}
            >
              <PlusOutlined /> Add New Host
            </Dropdown.Button>
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            <Table
              columns={[
                {
                  title: 'Host Name',
                  render: (_, node) => {
                    const hostName = getExtendedNode(node, store.hostsCommonDetails).name;
                    return (
                      <>
                        <Link to={getNetworkHostRoute(node.hostid, node.network)}>{hostName}</Link>
                        {node.pendingdelete && (
                          <Badge style={{ marginLeft: '1rem' }} status="processing" color="red" text="Removing..." />
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
                  title: 'Private Address (IPv4)',
                  dataIndex: 'address',
                },
                network?.isipv6
                  ? {
                      title: 'Private Address (IPv6)',
                      dataIndex: 'address6',
                    }
                  : {},
                {
                  title: 'Public Address',
                  render(_, node) {
                    return getExtendedNode(node, store.hostsCommonDetails)?.endpointip ?? '';
                  },
                },
                // {
                //   title: 'Preferred DNS',
                //   dataIndex: 'name',
                // },
                {
                  title: 'Connectivity',
                  render: (_, node) => (
                    <Tag color={node.connected ? 'green' : 'red'}>{node.connected ? 'Connected' : 'Disconnected'}</Tag>
                  ),
                },
                {
                  title: 'Health Status',
                  render(_, node) {
                    return getHostHealth(node.hostid, [node]);
                  },
                },
                {
                  width: '1rem',
                  align: 'right',
                  render(_: boolean, node) {
                    return (
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'edit',
                              label: 'Edit',
                              disabled: node.pendingdelete !== false,
                              title: node.pendingdelete !== false ? 'Host is being removed from network' : '',
                              onClick: () => editNode(node),
                            },
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
                          ],
                        }}
                      >
                        <MoreOutlined />
                      </Dropdown>
                    );
                  },
                },
              ]}
              dataSource={networkNodes}
              rowKey="id"
              size="small"
            />
          </Col>
        </Row>
      </div>
    );
  }, [
    searchHost,
    network?.isipv6,
    networkNodes,
    store.hostsCommonDetails,
    editNode,
    disconnectNodeFromNetwork,
    removeNodeFromNetwork,
  ]);

  const getDnsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row justify="space-between" style={{ marginBottom: '1rem', width: '100%' }}>
          <Col xs={12} md={8}>
            <Input
              size="large"
              placeholder="Search DNS"
              value={searchDns}
              onChange={(ev) => setSearchDns(ev.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={() => setIsAddDnsModalOpen(true)}>
              <PlusOutlined /> Add DNS
            </Button>
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            <Table
              columns={[
                {
                  title: 'DNS Entry',
                  render(_, dns) {
                    return <Typography.Text copyable>{`${dns.name}`}</Typography.Text>;
                  },
                  sorter: (a, b) => a.name.localeCompare(b.name),
                  defaultSortOrder: 'ascend',
                },
                {
                  title: 'IP Addresses',
                  render(_, dns) {
                    return (
                      <Typography.Text copyable>{[dns.address].concat(dns.address6 || []).join(', ')}</Typography.Text>
                    );
                  },
                },
                {
                  title: '',
                  key: 'action',
                  width: '1rem',
                  render: (_, dns) => (
                    <Dropdown
                      placement="bottomRight"
                      menu={{
                        items: [
                          {
                            key: 'delete',
                            disabled: isDefaultDns(dns),
                            label: (
                              <Tooltip title={isDefaultDns(dns) ? 'Cannot delete default DNS' : 'Delete DNS'}>
                                <Typography.Text
                                  disabled={isDefaultDns(dns)}
                                  onClick={() => (isDefaultDns(dns) ? undefined : confirmDeleteDns(dns))}
                                >
                                  <DeleteOutlined /> Delete
                                </Typography.Text>
                              </Tooltip>
                            ),
                          },
                        ] as MenuProps['items'],
                      }}
                    >
                      <MoreOutlined />
                    </Dropdown>
                  ),
                },
              ]}
              dataSource={dnses.filter((dns) => dns.name.toLocaleLowerCase().includes(searchDns.toLocaleLowerCase()))}
              rowKey="name"
              size="small"
            />
          </Col>
        </Row>
      </div>
    );
  }, [confirmDeleteDns, dnses, isDefaultDns, searchDns]);

  const getClientsContent = useCallback(() => {
    const isEmpty = clients.length === 0 && clientGateways.length === 0;

    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {isEmpty && (
          <Row
            className="page-padding"
            style={{
              background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              width: '100%',
            }}
          >
            <Col xs={(24 * 2) / 3}>
              <Typography.Title level={3} style={{ color: 'white ' }}>
                Clients
              </Typography.Title>
              <Typography.Text style={{ color: 'white ' }}>
                Client Gateways enable secure access to your network via Clients. The Gateway forwards traffic from the
                clients into the network, and from the network back to the clients. Clients are simple WireGuard config
                files, supported on most devices. To use Clients, you must configure a Client Gateway, which is
                typically deployed in a public cloud environment, e.g. on a server with a public IP, so that it is
                easily reachable from the Clients.{' '}
                <a href="https://www.netmaker.io/features/ingress" target="_blank" rel="noreferrer">
                  Learn More
                </a>
              </Typography.Text>
            </Col>
            <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
              <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Client</Typography.Title>
                <Typography.Text>
                  Enable remote access to your network with a Client. A Client is a simple config file that runs on any
                  device that supports{' '}
                  <a href="https://www.wireguard.com/install" target="_blank" rel="noreferrer">
                    (WireGuard)
                  </a>
                  . Apply the config file on your device, and it will have secure access to your network via the Client
                  Gateway.
                </Typography.Text>
                {clientGateways.length === 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="No Client Gateway"
                    description="You will be prompted to create a gateway for your network when creating a client."
                    style={{ marginTop: '1rem' }}
                  />
                )}
                <Row style={{ marginTop: '1rem' }}>
                  <Col>
                    <Button type="primary" size="large" onClick={() => setIsAddClientModalOpen(true)}>
                      <PlusOutlined /> Create Client
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {!isEmpty && (
          <Row style={{ width: '100%' }}>
            <Col xs={12} style={{ marginBottom: '2rem' }}>
              <Input
                placeholder="Search gateways"
                value={searchClientGateways}
                onChange={(ev) => setSearchClientGateways(ev.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: '60%' }}
              />
            </Col>
            <Col xs={12} style={{ marginBottom: '2rem' }}>
              <Input
                placeholder="Search clients"
                value={searchClients}
                onChange={(ev) => setSearchClients(ev.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: '60%' }}
              />
            </Col>
            <Col xs={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Gateways
                  </Typography.Title>
                </Col>
                <Col xs={11} style={{ textAlign: 'right' }}>
                  <Button type="primary" onClick={() => setIsAddClientGatewayModalOpen(true)}>
                    <PlusOutlined /> Create Gateway
                  </Button>
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <Table
                    columns={gatewaysTableCols}
                    dataSource={filteredClientGateways}
                    rowKey="id"
                    size="small"
                    rowClassName={(gateway) => {
                      return gateway.id === selectedGateway?.id ? 'selected-row' : '';
                    }}
                    onRow={(gateway) => {
                      return {
                        onClick: () => {
                          if (selectedGateway?.id === gateway.id) setSelectedGateway(null);
                          else setSelectedGateway(gateway);
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
                    Clients
                  </Typography.Title>
                </Col>
                <Col xs={12} style={{ textAlign: 'right' }}>
                  {selectedGateway && (
                    <Button
                      type="primary"
                      style={{ marginRight: '1rem' }}
                      onClick={() => setIsAddClientModalOpen(true)}
                    >
                      <PlusOutlined /> Create Client
                    </Button>
                  )}
                  Display All{' '}
                  <Switch
                    title="Display all clients. Click a gateway to filter clients specific to that gateway."
                    checked={selectedGateway === null}
                    onClick={() => {
                      setSelectedGateway(null);
                    }}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={24}>
                  <Table columns={clientsTableCols} dataSource={filteredClients} rowKey="clientid" size="small" />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </div>
    );
  }, [
    clients.length,
    clientGateways.length,
    searchClientGateways,
    searchClients,
    gatewaysTableCols,
    filteredClientGateways,
    selectedGateway,
    clientsTableCols,
    filteredClients,
  ]);

  const getEgressContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {egresses.length === 0 && (
          <Row
            className="page-padding"
            style={{
              background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              width: '100%',
            }}
          >
            <Col xs={16}>
              <Typography.Title level={3} style={{ color: 'white ' }}>
                Egress
              </Typography.Title>
              <Typography.Text style={{ color: 'white ' }}>
                Enable devices in your network to communicate with other devices outside the network via egress
                gateways. An office network, home network, data center, or cloud region all become easily accessible via
                the Egress Gateway. You can even set a machine as an Internet Gateway to create a “traditional” VPN{' '}
                <a href="https://www.netmaker.io/features/egress" target="_blank" rel="noreferrer">
                  (Learn more)
                </a>
                .
              </Typography.Text>
            </Col>
            <Col xs={8} style={{ position: 'relative' }}>
              <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Egress</Typography.Title>
                <Typography.Text>
                  Select a device to act as your Egress Gateway. This device must have access to the target network, and
                  must run Linux (for now).
                </Typography.Text>
                <Row style={{ marginTop: '5rem' }}>
                  <Col>
                    <Button type="primary" size="large" onClick={() => setIsAddEgressModalOpen(true)}>
                      <PlusOutlined /> Create Egress
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {egresses.length > 0 && (
          <Row style={{ width: '100%' }}>
            <Col xs={24} style={{ marginBottom: '2rem' }}>
              <Input
                placeholder="Search egress"
                value={searchEgress}
                onChange={(ev) => setSearchEgress(ev.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: '30%' }}
              />
            </Col>
            <Col xs={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Egress Gateways
                  </Typography.Title>
                </Col>
                <Col xs={11} style={{ textAlign: 'right' }}>
                  <Button type="primary" onClick={() => setIsAddEgressModalOpen(true)}>
                    <PlusOutlined /> Create Egress
                  </Button>
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <Table
                    columns={egressTableCols}
                    dataSource={filteredEgresses}
                    rowKey="id"
                    size="small"
                    rowClassName={(egress) => {
                      return egress.id === filteredEgress?.id ? 'selected-row' : '';
                    }}
                    onRow={(egress) => {
                      return {
                        onClick: () => {
                          if (filteredEgress?.id === egress.id) setFilteredEgress(null);
                          else setFilteredEgress(egress);
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
                    External routes
                  </Typography.Title>
                </Col>
                <Col xs={12} style={{ textAlign: 'right' }}>
                  {filteredEgress && (
                    <Button
                      type="primary"
                      style={{ marginRight: '1rem' }}
                      onClick={() => setIsUpdateEgressModalOpen(true)}
                    >
                      <PlusOutlined /> Add external route
                    </Button>
                  )}
                  Display All{' '}
                  <Switch
                    title="Display all routes. Click an egress to filter routes specific to that egress."
                    checked={filteredEgress === null}
                    onClick={() => {
                      setFilteredEgress(null);
                    }}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={24}>
                  <Table
                    columns={externalRoutesTableCols}
                    dataSource={filteredExternalRoutes}
                    rowKey={(range) => `${range.node?.name ?? ''}-${range.range}`}
                    size="small"
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </div>
    );
  }, [
    egresses,
    searchEgress,
    egressTableCols,
    filteredEgresses,
    filteredEgress,
    externalRoutesTableCols,
    filteredExternalRoutes,
  ]);

  const getRelayContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {relays.length === 0 && (
          <Row
            className="page-padding"
            style={{
              background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              width: '100%',
            }}
          >
            <Col xs={16}>
              <Typography.Title level={3} style={{ color: 'white ' }}>
                Relays
              </Typography.Title>
              <Typography.Text style={{ color: 'white ' }}>
                Enable devices in your network to communicate with othererwise unreachable devices with relays.{' '}
                {branding.productName} uses Turn servers to automatically route traffic in these scenarios, but
                sometimes, you’d rather specify which device should be routing the traffic
                <a href="https://www.netmaker.io/features/relay" target="_blank" rel="noreferrer">
                  (Learn More)
                </a>
                .
              </Typography.Text>
            </Col>
            <Col xs={8} style={{ position: 'relative' }}>
              <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Relay</Typography.Title>
                <Typography.Text>
                  Select a device to relay traffic to/from another device. The Relay is typically (but not always)
                  publicly accessible, and in a nearby location to the target device, to minimize latency.
                </Typography.Text>
                <Row style={{ marginTop: '5rem' }}>
                  <Col>
                    <Button type="primary" size="large" onClick={() => setIsAddRelayModalOpen(true)}>
                      <PlusOutlined /> Create Relay
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {relays.length > 0 && (
          <Row style={{ width: '100%' }}>
            <Col xs={24} style={{ marginBottom: '2rem' }}>
              <Input
                placeholder="Search relay"
                value={searchRelay}
                onChange={(ev) => setSearchRelay(ev.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: '30%' }}
              />
            </Col>
            <Col xs={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Relays
                  </Typography.Title>
                </Col>
                <Col xs={11} style={{ textAlign: 'right' }}>
                  <Button type="primary" onClick={() => setIsAddRelayModalOpen(true)}>
                    <PlusOutlined /> Create Relay
                  </Button>
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <Table
                    columns={relayTableCols}
                    dataSource={filteredRelays}
                    rowKey="id"
                    size="small"
                    rowClassName={(relay) => {
                      return relay.id === selectedRelay?.id ? 'selected-row' : '';
                    }}
                    onRow={(relay) => {
                      return {
                        onClick: () => {
                          if (selectedRelay?.id === relay.id) setSelectedRelay(null);
                          else setSelectedRelay(relay);
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
                    Relayed Hosts
                  </Typography.Title>
                </Col>
                <Col xs={12} style={{ textAlign: 'right' }}>
                  {selectedRelay && (
                    <Button
                      type="primary"
                      style={{ marginRight: '1rem' }}
                      onClick={() => setIsUpdateRelayModalOpen(true)}
                    >
                      <PlusOutlined /> Add relayed host
                    </Button>
                  )}
                  Display All{' '}
                  <Switch
                    title="Display all relayed hosts. Click a relay to filter hosts relayed only by that relay."
                    checked={selectedRelay === null}
                    onClick={() => {
                      setSelectedRelay(null);
                    }}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={24}>
                  <Table columns={relayedTableCols} dataSource={filteredRelayedNodes} rowKey="id" size="small" />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </div>
    );
  }, [
    branding.productName,
    filteredRelayedNodes,
    filteredRelays,
    relayTableCols,
    relayedTableCols,
    relays.length,
    searchRelay,
    selectedRelay,
  ]);

  const getAclsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row style={{ width: '100%' }}>
          <Col xs={12}>
            <Input
              allowClear
              placeholder="Search host"
              value={searchAclHost}
              onChange={(ev) => setSearchAclHost(ev.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: '60%' }}
            />
            {isServerEE && (
              <span style={{ marginLeft: '2rem' }} data-nmui-intercom="network-details-acls_showclientstoggle">
                <label style={{ marginRight: '1rem' }} htmlFor="show-clients-acl-switch">
                  Show Clients
                </label>
                <Switch
                  id="show-clients-acl-switch"
                  checked={showClientAcls}
                  onChange={(newVal) => setShowClientAcls(newVal)}
                />
              </span>
            )}
          </Col>
          <Col xs={12} style={{ textAlign: 'right' }}>
            <Button
              title="Allow All"
              style={{ marginRight: '1rem', color: '#3C8618', borderColor: '#274916' }}
              icon={<CheckOutlined />}
              onClick={() => {
                // set node acls
                setNodeAcls((prevAcls) => {
                  const newAcls = structuredClone(prevAcls);
                  for (const nodeId1 in newAcls) {
                    if (Object.prototype.hasOwnProperty.call(newAcls, nodeId1)) {
                      const nodeAcl = newAcls[nodeId1];
                      for (const nodeId in nodeAcl) {
                        if (Object.prototype.hasOwnProperty.call(nodeAcl, nodeId)) {
                          nodeAcl[nodeId] = 2;
                        }
                      }
                    }
                  }
                  return newAcls;
                });

                // set client acls
                setClientAcls((prevAcls) => {
                  const newAcls = structuredClone(prevAcls);
                  for (const clientId in newAcls) {
                    if (Object.prototype.hasOwnProperty.call(newAcls, clientId)) {
                      newAcls[clientId] = {};
                    }
                  }
                  return newAcls;
                });
              }}
            />
            <Button
              danger
              title="Block All"
              style={{ marginRight: '1rem' }}
              icon={<StopOutlined />}
              onClick={() => {
                // set node acls
                setNodeAcls((prevAcls) => {
                  const newAcls = structuredClone(prevAcls);
                  for (const nodeId1 in newAcls) {
                    if (Object.prototype.hasOwnProperty.call(newAcls, nodeId1)) {
                      const nodeAcl = newAcls[nodeId1];
                      for (const nodeId in nodeAcl) {
                        if (Object.prototype.hasOwnProperty.call(nodeAcl, nodeId)) {
                          nodeAcl[nodeId] = 1;
                        }
                      }
                    }
                  }
                  return newAcls;
                });

                // set client acls
                setClientAcls((prevAcls) => {
                  const newAcls = structuredClone(prevAcls);
                  for (const clientId in newAcls) {
                    if (Object.prototype.hasOwnProperty.call(newAcls, clientId)) {
                      newAcls[clientId] = {};

                      clients.forEach((c) => {
                        newAcls[clientId][c.clientid] = {} as never;
                      });

                      networkNodes.forEach((n) => {
                        newAcls[clientId][n.id] = {} as never;
                      });
                    }
                  }
                  return newAcls;
                });
              }}
            />
            <Button
              title="Reset"
              style={{ marginRight: '1rem' }}
              icon={<ReloadOutlined />}
              onClick={() => {
                setNodeAcls(originalNodeAcls);
                setClientAcls(originalClientAcls);
              }}
              disabled={!hasAclsBeenEdited}
            />
            <Button
              type="primary"
              onClick={async () => {
                try {
                  if (!networkId) return;
                  setIsSubmittingAcls(true);
                  const newAcls = (await NetworksService.updateAcls(networkId, nodeAcls)).data;
                  if (isServerEE) await updateAllClientsAcls();
                  setOriginalNodeAcls(newAcls);
                  setNodeAcls(newAcls);
                  notify.success({
                    message: 'ACLs updated',
                  });
                } catch (err) {
                  notify.error({
                    message: 'Error updating ACLs',
                    description: extractErrorMsg(err as any),
                  });
                } finally {
                  setIsSubmittingAcls(false);
                }
              }}
              disabled={!hasAclsBeenEdited}
              loading={isSubmittingAcls}
            >
              Submit Changes
            </Button>
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            <div className="" style={{ width: '100%', overflow: 'auto' }}>
              <VirtualisedTable
                columns={aclTableCols}
                dataSource={filteredAclData}
                className="acl-table"
                rowKey="nodeOrClientId"
                size="small"
                pagination={false}
                scroll={{
                  x: '100%',
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    );
  }, [
    searchAclHost,
    showClientAcls,
    hasAclsBeenEdited,
    isSubmittingAcls,
    aclTableCols,
    filteredAclData,
    clients,
    networkNodes,
    originalNodeAcls,
    originalClientAcls,
    networkId,
    nodeAcls,
    isServerEE,
    updateAllClientsAcls,
    notify,
  ]);

  const getGraphContent = useCallback(() => {
    const containerHeight = '78vh';

    if (!network) {
      return (
        <div
          className=""
          style={{
            width: '100%',
            height: containerHeight,
            display: 'flex',
            justifyContent: 'center',
            alignContent: 'center',
          }}
        >
          <LoadingOutlined style={{ fontSize: '5rem' }} spin />
        </div>
      );
    }

    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row style={{ width: '100%' }}>
          <Col xs={24} style={{ width: '100%', height: containerHeight }}>
            <SigmaContainer
              id={NETWORK_GRAPH_SIGMA_CONTAINER_ID}
              style={{
                backgroundColor: themeToken.colorBgContainer,
                position: 'relative',
              }}
            >
              <NetworkGraph
                network={network}
                hosts={networkHosts}
                nodes={networkNodes}
                acl={networkAcls}
                clients={clients}
              />
              <ControlsContainer position={'top-left'}>
                <ZoomControl />
                <FullScreenControl />
              </ControlsContainer>
              <ControlsContainer position={'top-left'} className="search-container">
                <SearchControl />
              </ControlsContainer>
            </SigmaContainer>
          </Col>
        </Row>
      </div>
    );
  }, [clients, network, networkAcls, networkHosts, networkNodes, themeToken.colorBgContainer]);

  const getMetricsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row style={{ width: '100%' }}>
          <Col xs={16}>
            <Radio.Group value={currentMetric} onChange={(ev) => setCurrentMetric(ev.target.value)}>
              <Radio.Button value="connectivity-status" data-nmui-intercom="network-details-metrics_connectivitystatus">
                Connectivity Status
              </Radio.Button>
              <Radio.Button value="latency" data-nmui-intercom="network-details-metrics_latency">
                Latency
              </Radio.Button>
              <Radio.Button value="bytes-sent" data-nmui-intercom="network-details-metrics_bytessent">
                Bytes Sent
              </Radio.Button>
              <Radio.Button value="bytes-received" data-nmui-intercom="network-details-metrics_bytesreceived">
                Bytes Received
              </Radio.Button>
              <Radio.Button value="uptime" data-nmui-intercom="network-details-metrics_uptime">
                Uptime
              </Radio.Button>
              <Radio.Button value="clients" data-nmui-intercom="network-details-metrics_clients">
                Clients
              </Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={8} style={{ textAlign: 'right' }}>
            {/* <Button type="primary" loading={isDownloadingMetrics} onClick={() => downloadMetrics()}>
              <DownloadOutlined />
              Download Metrics
            </Button> */}
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            <div className="" style={{ width: '100%', overflow: 'auto' }}>
              {currentMetric === 'connectivity-status' && (
                <Table
                  columns={metricsTableCols}
                  dataSource={connectivityStatusMetricsData}
                  className="connectivity-status-metrics-table"
                  rowKey="nodeId"
                  size="small"
                  pagination={{ pageSize: 100 }}
                />
              )}
              {currentMetric === 'latency' && (
                <Table
                  columns={metricsTableCols}
                  dataSource={latencyMetricsData}
                  className="latency-metrics-table"
                  rowKey="nodeId"
                  size="small"
                  pagination={{ pageSize: 100 }}
                />
              )}
              {currentMetric === 'bytes-sent' && (
                <Table
                  columns={metricsTableCols}
                  dataSource={bytesSentMetricsData}
                  className="bytes-sent-metrics-table"
                  rowKey="nodeId"
                  size="small"
                  pagination={{ pageSize: 100 }}
                />
              )}
              {currentMetric === 'bytes-received' && (
                <Table
                  columns={metricsTableCols}
                  dataSource={bytesReceivedMetricsData}
                  className="bytes-received-metrics-table"
                  rowKey="nodeId"
                  size="small"
                  pagination={{ pageSize: 100 }}
                />
              )}
              {currentMetric === 'uptime' && (
                <Table
                  columns={metricsTableCols}
                  dataSource={latencyMetricsData}
                  className="latency-metrics-table"
                  rowKey="nodeId"
                  size="small"
                  pagination={{ pageSize: 100 }}
                />
              )}
              {currentMetric === 'clients' && (
                <Table
                  columns={clientMetricsTableCols}
                  dataSource={clientsMetricsData}
                  className="clients-metrics-table"
                  rowKey="node_name"
                  size="small"
                  pagination={{ pageSize: 100 }}
                />
              )}
            </div>
          </Col>
        </Row>
      </div>
    );
  }, [
    currentMetric,
    metricsTableCols,
    connectivityStatusMetricsData,
    latencyMetricsData,
    bytesSentMetricsData,
    bytesReceivedMetricsData,
    clientMetricsTableCols,
    clientsMetricsData,
    // isDownloadingMetrics,
    // downloadMetrics,
  ]);

  const networkTabs: TabsProps['items'] = useMemo(() => {
    const tabs = [
      {
        key: 'overview',
        label: `Overview`,
        children: network ? getOverviewContent() : <Skeleton active />,
      },
      {
        key: 'hosts',
        label: `Hosts (${networkHosts.length})`,
        children: network ? getHostsContent() : <Skeleton active />,
      },
      {
        key: 'clients',
        label: `Clients (${clients.length})`,
        children: network ? getClientsContent() : <Skeleton active />,
      },
      {
        key: 'egress',
        label: `Egress (${egresses.length})`,
        children: network ? getEgressContent() : <Skeleton active />,
      },
      {
        key: 'dns',
        label: `DNS`,
        children: network ? getDnsContent() : <Skeleton active />,
      },
      {
        key: 'access-control',
        label: `Access Control`,
        children: network ? getAclsContent() : <Skeleton active />,
      },
      {
        key: 'graph',
        label: `Graph`,
        children: network ? getGraphContent() : <Skeleton active />,
      },
    ].concat(
      isServerEE
        ? [
            {
              key: 'metrics',
              label: `Metrics`,
              children: network ? getMetricsContent() : <Skeleton active />,
            },
          ]
        : [],
    );

    if (isServerEE) {
      tabs.splice(3, 0, {
        key: 'relays',
        label: `Relays (${relays.length})`,
        children: network ? getRelayContent() : <Skeleton active />,
      });
    }

    return tabs;
  }, [
    network,
    getOverviewContent,
    networkHosts.length,
    getHostsContent,
    clients.length,
    getClientsContent,
    egresses.length,
    getEgressContent,
    relays.length,
    getRelayContent,
    getDnsContent,
    getAclsContent,
    getGraphContent,
    isServerEE,
    getMetricsContent,
  ]);

  const loadDnses = useCallback(async () => {
    try {
      if (!networkId) return;
      const dnses = (await NetworksService.getDnses()).data;
      const networkDnses = dnses.filter((dns) => dns.network === networkId);
      setDnses(networkDnses);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Error loading DNSes',
          description: extractErrorMsg(err),
        });
      }
    }
  }, [networkId, notify]);

  const loadMetrics = useCallback(async () => {
    try {
      if (!networkId) return;
      const nodeMetrics = (await NetworksService.getNodeMetrics(networkId)).data;
      setNetworkNodeMetrics(nodeMetrics);
      const clientMetrics = (await NetworksService.getClientMetrics(networkId)).data ?? {};
      setClientMetrics(clientMetrics);
    } catch (err) {
      notify.error({
        message: 'Error loading host metrics',
        description: extractErrorMsg(err as any),
      });
    }
  }, [networkId, notify]);

  const loadNetwork = useCallback(() => {
    setIsLoading(true);
    // route to networks if id is not present
    if (!networkId) {
      navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE));
    }
    // load from store
    const network = store.networks.find((network) => network.netid === networkId);
    if (!network) {
      notify.error({ message: `Network ${networkId} not found` });
      navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE));
      return;
    }
    setNetwork(network);

    // load extra data
    loadDnses();
    loadAcls();
    loadClients();

    if (isServerEE) {
      loadMetrics();
    }

    setIsLoading(false);
  }, [networkId, store.networks, loadDnses, loadAcls, loadClients, isServerEE, navigate, notify, loadMetrics]);

  // const onNetworkFormEdit = useCallback(async () => {
  //   try {
  //     const formData = await form.validateFields();
  //     const network = store.networks.find((network) => network.netid === networkId);
  //     if (!networkId || !network) {
  //       throw new Error('Network not found');
  //     }
  //     const newNetwork = (
  //       await NetworksService.updateNetwork(networkId, convertUiNetworkToNetworkPayload({ ...network, ...formData }))
  //     ).data;
  //     store.updateNetwork(networkId, convertNetworkPayloadToUiNetwork(newNetwork));
  //     notify.success({ message: `Network ${networkId} updated` });
  //     setIsEditingNetwork(false);
  //   } catch (err) {
  //     if (err instanceof AxiosError) {
  //       notify.error({
  //         message: 'Failed to save changes',
  //         description: extractErrorMsg(err),
  //       });
  //     } else {
  //       notify.error({
  //         message: err instanceof Error ? err.message : 'Failed to save changes',
  //       });
  //     }
  //   }
  // }, [form, networkId, notify, store]);

  const onNetworkDelete = useCallback(async () => {
    try {
      if (!networkId) {
        throw new Error('Network not found');
      }
      await NetworksService.deleteNetwork(networkId);
      notify.success({ message: `Network ${networkId} deleted` });
      store.deleteNetwork(networkId);
      navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE));
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to delete network',
          description: extractErrorMsg(err),
        });
      } else {
        notify.error({
          message: err instanceof Error ? err.message : 'Failed to delete network',
        });
      }
    }
  }, [networkId, notify, navigate, store]);

  const onCreateDns = useCallback((dns: DNS) => {
    setDnses((prevDnses) => [...prevDnses, dns]);
    setIsAddDnsModalOpen(false);
  }, []);

  const promptConfirmDelete = () => {
    Modal.confirm({
      title: `Do you want to delete network ${network?.netid}?`,
      icon: <ExclamationCircleFilled />,
      onOk() {
        onNetworkDelete();
      },
      okType: 'danger',
    });
  };

  useEffect(() => {
    loadNetwork();
  }, [loadNetwork]);

  // refresh form to prevent stick network data across different network details pages
  useEffect(() => {
    if (!network) return;
    form.setFieldsValue(network);
  }, [form, network]);

  if (!networkId) {
    navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE));
    return null;
  }

  return (
    <Layout.Content
      className="NetworkDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
      key={networkId}
    >
      <Skeleton loading={isLoading} active className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding">
          <Col xs={24}>
            <Link to={resolveAppRoute(AppRoutes.NETWORKS_ROUTE)}>View All Networks</Link>
            <Row>
              <Col xs={18}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  {network?.netid}
                </Typography.Title>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                {/* {!isEditingNetwork && (
                  <Button type="default" style={{ marginRight: '.5rem' }} onClick={() => setIsEditingNetwork(true)}>
                    Edit
                  </Button>
                )}
                {isEditingNetwork && (
                  <>
                    <Button type="primary" style={{ marginRight: '.5rem' }} onClick={onNetworkFormEdit}>
                      Save Changes
                    </Button>
                    <Button
                      style={{ marginRight: '.5rem' }}
                      onClick={() => {
                        setIsEditingNetwork(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )} */}
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'delete',
                        label: 'Delete',
                        danger: true,
                        icon: <DeleteOutlined />,
                        onClick: promptConfirmDelete,
                      },
                    ],
                  }}
                >
                  <Button>
                    <SettingOutlined /> Network Settings
                  </Button>
                </Dropdown>
              </Col>
            </Row>

            <Tabs items={networkTabs} />
          </Col>
        </Row>
      </Skeleton>

      {/* misc */}
      {notifyCtx}
      <AddDnsModal
        isOpen={isAddDnsModalOpen}
        networkId={networkId}
        onCreateDns={onCreateDns}
        onCancel={() => setIsAddDnsModalOpen(false)}
      />
      <AddClientModal
        isOpen={isAddClientModalOpen}
        networkId={networkId}
        preferredGateway={selectedGateway ?? undefined}
        onCreateClient={() => {
          loadClients();
          store.fetchNodes();
          setIsAddClientModalOpen(false);
        }}
        onCancel={() => setIsAddClientModalOpen(false)}
      />
      <AddEgressModal
        isOpen={isAddEgressModalOpen}
        networkId={networkId}
        onCreateEgress={() => {
          store.fetchNodes();
          setIsAddEgressModalOpen(false);
        }}
        onCancel={() => setIsAddEgressModalOpen(false)}
      />
      {targetClient && (
        <ClientDetailsModal
          key={`read-${targetClient.clientid}`}
          isOpen={isClientDetailsModalOpen}
          client={targetClient}
          // onDeleteClient={() => {
          //   loadClients();
          // }}
          onUpdateClient={(updatedClient: ExternalClient) => {
            setClients((prev) => prev.map((c) => (c.clientid === targetClient.clientid ? updatedClient : c)));
            setTargetClient(updatedClient);
          }}
          onCancel={() => setIsClientDetailsModalOpen(false)}
        />
      )}
      {filteredEgress && (
        <UpdateEgressModal
          key={filteredEgress.id}
          isOpen={isUpdateEgressModalOpen}
          networkId={networkId}
          egress={filteredEgress}
          onUpdateEgress={() => {
            store.fetchNodes();
            setIsUpdateEgressModalOpen(false);
          }}
          onCancel={() => setIsUpdateEgressModalOpen(false)}
        />
      )}
      <AddRelayModal
        isOpen={isAddRelayModalOpen}
        networkId={networkId}
        onCreateRelay={() => {
          store.fetchNodes();
          setIsAddRelayModalOpen(false);
        }}
        onCancel={() => setIsAddRelayModalOpen(false)}
      />
      {selectedRelay && (
        <UpdateRelayModal
          key={selectedRelay.id}
          isOpen={isUpdateRelayModalOpen}
          relay={selectedRelay}
          networkId={networkId}
          onUpdateRelay={() => {
            // store.fetchHosts();
            setIsUpdateRelayModalOpen(false);
          }}
          onCancel={() => setIsUpdateRelayModalOpen(false)}
        />
      )}
      <AddHostsToNetworkModal
        isOpen={isAddHostsToNetworkModalOpen}
        networkId={networkId}
        onNetworkUpdated={() => {
          store.fetchNetworks();
          setIsAddHostsToNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddHostsToNetworkModalOpen(false)}
      />
      <NewHostModal
        isOpen={isAddNewHostModalOpen}
        onFinish={() => setIsAddNewHostModalOpen(false)}
        onCancel={() => setIsAddNewHostModalOpen(false)}
        networkId={networkId}
      />
      <AddIngressModal
        isOpen={isAddClientGatewayModalOpen}
        networkId={networkId}
        onCreateIngress={() => {
          store.fetchNodes();
          setIsAddClientGatewayModalOpen(false);
        }}
        onCancel={() => setIsAddClientGatewayModalOpen(false)}
      />
      {selectedGateway && (
        <UpdateIngressModal
          isOpen={isUpdateGatewayModalOpen}
          ingress={selectedGateway}
          networkId={networkId}
          onUpdateIngress={() => {
            setIsUpdateGatewayModalOpen(false);
          }}
          onCancel={() => setIsUpdateGatewayModalOpen(false)}
        />
      )}
      {selectedGateway && (
        <UpdateIngressUsersModal
          isOpen={isUpdateIngressUsersModalOpen}
          ingress={selectedGateway}
          networkId={networkId}
          onCancel={() => setIsUpdateIngressUsersModalOpen(false)}
        />
      )}
      {targetClient && (
        <UpdateClientModal
          key={`update-${targetClient.clientid}`}
          isOpen={isUpdateClientModalOpen}
          client={targetClient}
          networkId={networkId}
          onUpdateClient={() => {
            loadClients();
            setIsUpdateClientModalOpen(false);
          }}
          onCancel={() => setIsUpdateClientModalOpen(false)}
        />
      )}
      {targetNode && (
        <UpdateNodeModal
          isOpen={isUpdateNodeModalOpen}
          node={targetNode}
          onUpdateNode={() => {
            store.fetchNodes();
            setIsUpdateNodeModalOpen(false);
          }}
          onCancel={() => setIsUpdateNodeModalOpen(false)}
        />
      )}
    </Layout.Content>
  );
}
