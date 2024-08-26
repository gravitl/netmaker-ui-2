import AddClientModal from '@/components/modals/add-client-modal/AddClientModal';
import AddDnsModal from '@/components/modals/add-dns-modal/AddDnsModal';
import AddEgressModal from '@/components/modals/add-egress-modal/AddEgressModal';
import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import ClientDetailsModal from '@/components/modals/client-detaiils-modal/ClientDetailsModal';
import UpdateEgressModal from '@/components/modals/update-egress-modal/UpdateEgressModal';
import { ACL_ALLOWED, ACL_DENIED, ACL_UNDEFINED, AclStatus, NodeAcl, NodeAclContainer } from '@/models/Acl';
import { DNS } from '@/models/Dns';
import { ExternalClient } from '@/models/ExternalClient';
import { Host } from '@/models/Host';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { AppRoutes } from '@/routes';
import { HostsService } from '@/services/HostsService';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, getNodeConnectivityStatus, isNodeRelay } from '@/utils/NodeUtils';
import { getNetworkHostRoute, resolveAppRoute } from '@/utils/RouteUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import {
  CheckOutlined,
  DashOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MoreOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  Flex,
  FloatButton,
  Form,
  Input,
  Layout,
  MenuProps,
  Modal,
  notification,
  Progress,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageProps } from '../../models/Page';
import '@react-sigma/core/lib/react-sigma.min.css';
import './NetworkDetailsPage.scss';
import { ControlsContainer, FullScreenControl, SearchControl, SigmaContainer, ZoomControl } from '@react-sigma/core';
import NetworkGraph from '@/components/NetworkGraph';
import UpdateRelayModal from '@/components/modals/update-relay-modal/UpdateRelayModal';
import { MetricCategories, NetworkMetrics, NodeOrClientMetric, UptimeNodeMetrics } from '@/models/Metrics';
import {
  getHostHealth,
  isManagedHost,
  networkUsecaseMapText,
  renderMetricValue,
  useBranding,
  useServerLicense,
} from '@/utils/Utils';
import AddHostsToNetworkModal from '@/components/modals/add-hosts-to-network-modal/AddHostsToNetworkModal';
import NewHostModal from '@/components/modals/new-host-modal/NewHostModal';
import UpdateIngressModal from '@/components/modals/update-remote-access-gateway-modal/UpdateRemoteAccessGatewayModal';
import UpdateClientModal from '@/components/modals/update-client-modal/UpdateClientModal';
import { NULL_HOST, NULL_NODE } from '@/constants/Types';
import UpdateNodeModal from '@/components/modals/update-node-modal/UpdateNodeModal';
import VirtualisedTable from '@/components/VirtualisedTable';
import { NETWORK_GRAPH_SIGMA_CONTAINER_ID } from '@/constants/AppConstants';
import UpdateIngressUsersModal from '@/components/modals/update-ingress-users-modal/UpdateIngressUsersModal';
import getNodeImageProgram from 'sigma/rendering/webgl/programs/node.image';
import { HOST_HEALTH_STATUS } from '@/models/NodeConnectivityStatus';
import ClientConfigModal from '@/components/modals/client-config-modal/ClientConfigModal';
import { isSaasBuild } from '@/services/BaseService';
import { NetworkDetailTourStep } from '@/utils/Types';
import TourComponent, { JumpToTourStepObj } from '@/pages/networks/TourComponent';
import AddRemoteAccessGatewayModal from '@/components/modals/add-remote-access-gateway-modal/AddRemoteAccessGatewayModal';
import { InternetGatewaysPage } from './internet-gateways/InternetGatewaysPage';
import { AvailableOses } from '@/models/AvailableOses';
import { NetworkUsage, networkUsecaseMap } from '@/constants/NetworkUseCases';
import { NetworkUsecaseString } from '@/store/networkusecase';
import QuickSetupModal from '@/components/modals/quick-setup-modal/QuickSetupModal';
import DownloadRemotesAccessClientModal from '@/components/modals/remote-access-client-modal/DownloadRemoteAccessClientModal';
import SetNetworkFailoverModal from '@/components/modals/set-network-failover-modal/SetNetworkFailoverModal';
import { convertNetworkPayloadToUiNetwork, convertUiNetworkToNetworkPayload } from '@/utils/NetworkUtils';
import { TourType } from '../DashboardPage';
import { Waypoints } from 'lucide-react';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';

interface ExternalRoutesTableData {
  node: ExtendedNode;
  range: Node['egressgatewayranges'][0];
}

interface AclTableData {
  type: 'node' | 'client';
  nodeOrClientId: Node['id'] | ExternalClient['clientid'];
  name: Host['name'] | ExternalClient['clientid'];
  acls?: NodeAcl;
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

type ItemTextMap = {
  [key in keyof NetworkUsage]: string;
};

type ItemStepMap = {
  [key in keyof NetworkUsage]: NetworkDetailTourStep;
};

const HOSTS_DOCS_URL = 'https://docs.netmaker.io/ui-reference.html#hosts';
const ACLS_DOCS_URL = 'https://docs.netmaker.io/acls.html';
const RELAYS_DOCS_URL = 'https://docs.netmaker.io/pro/pro-relay-server.html';
const EGRESS_DOCS_URL = 'https://docs.netmaker.io/egress-gateway.html';
const GATEWAYS_DOCS_URL = 'https://docs.netmaker.io/external-clients.html';
const CLIENTS_DOCS_URL = 'https://docs.netmaker.io/external-clients.html#adding-clients-to-a-gateway';

export default function NetworkDetailsPage(props: PageProps) {
  const { networkId } = useParams<{ networkId: string }>();
  const store = useStore();
  const navigate = useNavigate();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const branding = useBranding();

  const storeFetchNodes = store.fetchNodes;
  const storeDeleteNode = store.deleteNode;
  const { isServerEE } = useServerLicense();
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
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [isClientConfigModalOpen, setIsClientConfigModalOpen] = useState(false);
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshingNetwork, setIsRefreshingNetwork] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [activeTabKey, setActiveTabKey] = useState('hosts');
  const [isDownloadRemoteAccessClientModalOpen, setIsDownloadRemoteAccessClientModalOpen] = useState(false);
  const [originalAcls, setOriginalAcls] = useState<NodeAclContainer>({});
  const [acls, setAcls] = useState<NodeAclContainer>({});
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [jumpTourStepObj, setJumpTourStepObj] = useState<JumpToTourStepObj>({
    overview: 0,
    hosts: 1,
    remoteAccess: 2,
    relays: 3,
    egress: 4,
    dns: 5,
    acls: 6,
    graph: 7,
    metrics: 8,
    vpnConfigs: 9,
    addEgressModal: 10,
    remoteAccessGatewayModal: 11,
    remoteAccessVPNConfigModal: 14,
  });
  const [isSetNetworkFailoverModalOpen, setIsSetNetworkFailoverModalOpen] = useState(false);
  const [isAddInternetGatewayModalOpen, setIsAddInternetGatewayModalOpen] = useState(false);
  // const [networkNodes, setNetworkNodes] = useState<ExtendedNode[]>([]);

  const overviewTabContainerRef = useRef(null);
  const hostsTabContainerTableRef = useRef(null);
  const hostsTabContainerAddHostsRef = useRef(null);
  const connectHostModalEnrollmentKeysTabRef = useRef(null);
  const connectHostModalSelectOSTabRef = useRef(null);
  const connectHostModalJoinNetworkTabRef = useRef(null);
  const remoteAccessTabGatewayTableRef = useRef(null);
  const remoteAccessTabAddGatewayRef = useRef(null);
  const addClientGatewayModalHostRef = useRef(null);
  const addClientGatewayModalDefaultClientDNSRef = useRef(null);
  const addClientGatewayModalIsInternetGatewayRef = useRef(null);
  const remoteAccessTabVPNConfigTableRef = useRef(null);
  const remoteAccessTabDisplayAllVPNConfigsRef = useRef(null);
  const remoteAccessTabVPNConfigCreateConfigRef = useRef(null);
  const remoteAccessManageUsersRef = useRef(null);
  const remoteAccessTabDownloadClientRef = useRef(null);
  const remoteAccessAddOrRemoveUsersRef = useRef(null);
  const createClientConfigModalSelectGatewayRef = useRef(null);
  const createClientConfigModalClientIDRef = useRef(null);
  const createClientConfigModalPublicKeyRef = useRef(null);
  const createClientConfigModalDNSRef = useRef(null);
  const createClientConfigModalAdditionalAddressesRef = useRef(null);
  const createClientConfigModalPostDownRef = useRef(null);
  const createClientConfigModalPostUpRef = useRef(null);
  const relaysTabRelayTableRef = useRef(null);
  const relaysTabAddRelayRef = useRef(null);
  const createRelayModalSelectHostRef = useRef(null);
  const relaysTabRelayedHostsTableRef = useRef(null);
  const relaysTabAddRelayedNodesRef = useRef(null);
  const relaysTabDisplayAllRelayedHostsRef = useRef(null);
  const addRelayedHostModalSelectHostRef = useRef(null);
  const egressTabEgressTableRef = useRef(null);
  const egressTabAddEgressRef = useRef(null);
  const createEgressModalSelectHostRef = useRef(null);
  const createEgressModalEnableNATRef = useRef(null);
  const createEgressModalSelectExternalRangesRef = useRef(null);
  const egressTabExternalRoutesTableRef = useRef(null);
  const egressTabAddExternalRouteRef = useRef(null);
  const egressTabDisplayAllExternalRoutesRef = useRef(null);
  const dnsTabDNSTableRef = useRef(null);
  const dnsTabAddDNSRef = useRef(null);
  const addDNSModalDNSNameRef = useRef(null);
  const addDNSModalAddressToAliasRef = useRef(null);
  const aclTabTableRef = useRef(null);
  const aclTabShowClientAclsRef = useRef(null);
  const aclTabAllowAllRef = useRef(null);
  const aclTabDenyAllRef = useRef(null);
  const aclTabResetRef = useRef(null);
  const aclTabSubmitRef = useRef(null);
  const graphTabContainerRef = useRef(null);
  const metricsTabConnectivityStatusTableRef = useRef(null);
  const metricsTabLatencyTableRef = useRef(null);
  const metricsTabBytesSentTableRef = useRef(null);
  const metricsTabBytesReceivedTableRef = useRef(null);
  const metricsTabUptimeTableRef = useRef(null);
  const metricsTabClientsTableRef = useRef(null);
  const internetGatewaysTableRef = useRef(null);
  const createInternetGatewayButtonRef = useRef(null);
  const internetGatewaysConnectedHostsTableRef = useRef(null);
  const internetGatewaysUpdateConnectedHostsRef = useRef(null);
  const createInternetGatewayModalSelectHostRef = useRef(null);
  const createInternetGatewayModalSelectConnectedHostsRef = useRef(null);
  const updateInternetGatewayModalSelectConnectedHostsRef = useRef(null);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === networkId),
    [store.nodes, store.hostsCommonDetails, networkId],
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

  const internetGatewaysCount = useMemo(() => {
    return networkNodes.filter((node) => node.isinternetgateway).length;
  }, [networkNodes]);

  const clientGateways = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isingressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const filteredClientGateways = useMemo<ExtendedNode[]>(() => {
    const filteredGateways = clientGateways.filter(
      (node) => node.name?.toLowerCase().includes(searchClientGateways.toLowerCase()) ?? false,
    );
    return filteredGateways;
  }, [clientGateways, searchClientGateways]);

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
      return filteredEgress.egressgatewayranges?.map((range) => ({
        node: getExtendedNode(filteredEgress, store.hostsCommonDetails),
        range,
      }));
    } else {
      return filteredEgresses
        .flatMap((e) => e.egressgatewayranges?.map((range) => ({ node: e, range })))
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

  const clientsMap = useMemo(
    () =>
      clients.reduce(
        (acc, c) => {
          acc[c.clientid] = c;
          return acc;
        },
        {} as Record<ExternalClient['clientid'], ExternalClient>,
      ),
    [clients],
  );

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

  const aclTableDataV2 = useMemo<AclTableData[]>(() => {
    // node acls
    const aclDataPerNode: AclTableData[] = networkNodes
      .map((node) => getExtendedNode(node, store.hostsCommonDetails))
      .map((node) => ({
        type: 'node',
        nodeOrClientId: node.id,
        name: node?.name ?? '',
        acls: acls[node.id],
      }));

    // client acls
    if (showClientAcls) {
      clients.forEach((client) => {
        aclDataPerNode.push({
          type: 'client',
          nodeOrClientId: client.clientid,
          name: client.clientid,
          acls: acls[client.clientid],
        });
      });
    }

    aclDataPerNode.sort((a, b) => a?.name?.localeCompare(b?.name ?? '') ?? 0);
    return aclDataPerNode;
  }, [acls, clients, networkNodes, showClientAcls, store.hostsCommonDetails]);

  const filteredAclDataV2 = useMemo<AclTableData[]>(() => {
    return aclTableDataV2.filter((node) => node.name.toLowerCase().includes(searchAclHost.toLowerCase()));
  }, [aclTableDataV2, searchAclHost]);

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
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) return;
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

  const openClientDetails = useCallback((client: ExternalClient) => {
    setTargetClient(client);
    setIsClientDetailsModalOpen(true);
  }, []);

  const confirmDeleteGateway = useCallback(
    (gateway: Node) => {
      Modal.confirm({
        title: `Delete gateway ${getExtendedNode(gateway, store.hostsCommonDetails).name}`,
        content: `Are you sure you want to delete this gateway? Any attached clients and remote users will be disconnected.`,
        onOk: async () => {
          try {
            await NodesService.deleteIngressNode(gateway.id, gateway.network);
            store.updateNode(gateway.id, { ...gateway, isingressgateway: false });
            storeFetchNodes();
            loadClients();
            setIsInitialLoad(true);
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
    [loadClients, notify, store, storeFetchNodes],
  );

  const confirmDeleteEgress = useCallback(
    (egress: Node) => {
      Modal.confirm({
        title: `Delete egress ${getExtendedNode(egress, store.hostsCommonDetails).name}`,
        content: `Are you sure you want to delete this egress?`,
        onOk: async () => {
          try {
            await NodesService.deleteEgressNode(egress.id, egress.network);
            store.updateNode(egress.id, { ...egress, isegressgateway: false, egressgatewayranges: [] });
            storeFetchNodes();
            setFilteredEgress(null);
            setIsInitialLoad(true);
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
    [notify, store, storeFetchNodes],
  );

  const confirmDeleteRange = useCallback(
    (range: ExternalRoutesTableData) => {
      Modal.confirm({
        title: `Delete range ${range.range} from ${range.node?.name ?? ''}`,
        content: `Are you sure you want to delete this external range?`,
        onOk: async () => {
          try {
            if (!networkId) return;
            let egressNode: Node;
            const newRanges = new Set(range.node.egressgatewayranges);
            const natEnabled = range.node.egressgatewaynatenabled;
            newRanges.delete(range.range);
            egressNode = (await NodesService.deleteEgressNode(range.node.id, networkId)).data;
            egressNode = (
              await NodesService.createEgressNode(range.node.id, networkId, {
                ranges: newRanges.size > 0 ? [...newRanges] : [],
                natEnabled: natEnabled ? 'yes' : 'no',
              })
            ).data;

            store.fetchNodes();
            setFilteredEgress(egressNode);
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
            store.updateNode(relay.id, { ...relay, relaynodes: [], isrelay: false });
            store.fetchNodes();
            setIsInitialLoad(true);
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

            const relayRes = (
              await NodesService.updateNode(relay.id, networkId, { ...relay, relaynodes: [...relayedIds] })
            ).data;

            setSelectedRelay(relayRes);
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

  const getGatewayDropdownOptions = useCallback(
    (gateway: Node) => {
      const defaultOptions: MenuProps['items'] = [
        {
          key: 'edit',
          label: (
            <Typography.Text>
              <EditOutlined /> Edit
            </Typography.Text>
          ),
          onClick: (info: any) => {
            setSelectedGateway(gateway);
            setIsUpdateGatewayModalOpen(true);
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
          onClick: (info: any) => {
            confirmDeleteGateway(gateway);
            info.domEvent.stopPropagation();
          },
        },
      ];
      return defaultOptions;
    },
    [confirmDeleteGateway],
  );

  const gatewaysTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        // width: 500,
        render(name, node) {
          return (
            <>
              <Typography.Link>{name}</Typography.Link>
              {node.isinternetgateway && (
                <GlobalOutlined
                  title="This host serves as an internet gateway: all traffic of connected clients would be routed through this host just like a traditional VPN"
                  style={{ color: branding.primaryColor }}
                  className="internet-gw-icon"
                />
              )}
            </>
          );
        },
        sorter: (a, b) => a.name?.localeCompare(b.name ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, node) {
          const addrs = ([] as Array<string>).concat(node.address || [], node.address6 || []);
          const endPointAddrs = ([] as Array<string>)
            .concat(node.endpointip ?? '', node.endpointipv6 ?? '', node.additional_rag_ips ?? '')
            .filter(Boolean);

          return (
            <>
              <Typography.Paragraph>
                <b>Private Adresses: </b>
                <br></br>
                {addrs.map((addr) => (
                  <>
                    <Typography.Text key={addr} copyable style={{ width: 200 }} ellipsis={{ tooltip: addrs }}>
                      {addr}
                    </Typography.Text>
                    <br></br>
                  </>
                ))}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <b>Endpoints: </b>
                <br></br>
                {endPointAddrs.map((addr) => (
                  <>
                    <Typography.Text key={addr} copyable style={{ width: 200 }} ellipsis={{ tooltip: endPointAddrs }}>
                      {addr}
                    </Typography.Text>
                    <br></br>
                  </>
                ))}
              </Typography.Paragraph>
            </>
          );
        },
      },
      {
        title: 'Default Client DNS',
        dataIndex: 'ingressdns',
      },
      {
        render(_, gateway) {
          return (
            <Flex>
              <Dropdown
                placement="bottomRight"
                menu={{
                  items: getGatewayDropdownOptions(gateway),
                }}
              >
                <Button type="text" icon={<MoreOutlined />} ref={remoteAccessAddOrRemoveUsersRef} />
              </Dropdown>
            </Flex>
          );
        },
      },
    ],
    [branding.primaryColor, getGatewayDropdownOptions],
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
          const addrs = ([] as Array<string>).concat(node.address || [], node.address6 || []).join(', ');
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Endpoint',
        render(_, node) {
          return (
            <Typography.Text>
              {([] as Array<string>)
                .concat(node.endpointip ?? '', node.endpointipv6 ?? '')
                .filter(Boolean)
                .join(', ')}
            </Typography.Text>
          );
        },
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
                      <Typography.Text>
                        <EditOutlined /> Update
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      setFilteredEgress(egress);
                      setIsUpdateEgressModalOpen(true);
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
                      confirmDeleteEgress(egress);
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
                    danger: true,
                    label: (
                      <>
                        <DeleteOutlined /> Delete
                      </>
                    ),
                    onClick: () => {
                      confirmDeleteRange(range);
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
    ];
  }, [confirmDeleteRange]);

  const clientsTableCols = useMemo<TableColumnProps<ExternalClient>[]>(
    () => [
      {
        title: 'ID',
        dataIndex: 'clientid',
        width: 150,
        render(value, client) {
          return <Typography.Link onClick={() => openClientDetails(client)}>{value}</Typography.Link>;
        },
      },
      {
        title: 'Owner',
        dataIndex: 'ownerid',
        width: 100,
        render(value) {
          return <Typography.Text>{value || 'n/a'}</Typography.Text>;
        },
      },
      {
        title: 'Addresses',
        render(_, client) {
          const addrs = ([] as Array<string>)
            .concat(client.address || [], client.address6 || [], client.extraallowedips || [])
            .join(', ');
          return (
            <Typography.Text key={addrs} copyable style={{ width: 150 }} ellipsis={{ tooltip: addrs }}>
              {addrs}
            </Typography.Text>
          );
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
          return assocIngress ? (getExtendedNode(assocIngress, store.hostsCommonDetails).name ?? '') : '';
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
                      <Typography.Text disabled={!isAdminUserOrRole(store.user!) && store.username !== client.ownerid}>
                        <EditOutlined /> Edit
                      </Typography.Text>
                    ),
                    disabled: !isAdminUserOrRole(store.user!) && store.username !== client.ownerid,
                    onClick: () => {
                      setTargetClient(client);
                      setIsUpdateClientModalOpen(true);
                    },
                  },
                  {
                    key: 'view',
                    label: (
                      <Typography.Text disabled={!isAdminUserOrRole(store.user!) && store.username !== client.ownerid}>
                        <EyeOutlined /> View Config
                      </Typography.Text>
                    ),
                    disabled: !isAdminUserOrRole(store.user!) && store.username !== client.ownerid,
                    onClick: () => {
                      setTargetClient(client);
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
                    disabled: !isAdminUserOrRole(store.user!) && store.username !== client.ownerid,
                    onClick: () => {
                      confirmDeleteClient(client);
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
    [
      confirmDeleteClient,
      networkNodes,
      openClientDetails,
      store.hostsCommonDetails,
      store.user,
      store.username,
      toggleClientStatus,
    ],
  );

  const relayTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
        render(value) {
          return <Typography.Link>{value}</Typography.Link>;
        },
        sorter: (a, b) => a.name?.localeCompare(b.name ?? '') ?? 0,
        defaultSortOrder: 'ascend',
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, node) {
          const addrs = ([] as Array<string>).concat(node.address || [], node.address6 || []).join(', ');
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
                      <Typography.Text>
                        <EditOutlined /> Update
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      setSelectedRelay(relay);
                      setIsUpdateRelayModalOpen(true);
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
                      confirmDeleteRelay(relay);
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
          const addrs = ([] as Array<string>).concat(node.address || [], node.address6 || []).join(', ');
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
                      <Typography.Text>
                        <DeleteOutlined /> Stop being relayed
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      confirmRemoveRelayed(
                        relayed,
                        networkNodes.find((node) => node.id === relayed.relayedby) ?? NULL_NODE,
                      );
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

  const aclTableColsV2 = useMemo<TableColumnProps<AclTableData>[]>(() => {
    const renderAclValue = (
      originalAclLevel: AclStatus,
      newAclLevel: AclStatus,
      nodeOrClientIdRowTuple: [type: 'client' | 'node', id: Node['id'] | ExternalClient['clientid']],
      nodeOrClientIdColTuple: [type: 'client' | 'node', id: Node['id'] | ExternalClient['clientid']],
    ) => {
      // always enable client-to-client ACLs sinnce that's not supported currently
      if (nodeOrClientIdRowTuple[0] === 'client' && nodeOrClientIdColTuple[0] === 'client') {
        if (newAclLevel === ACL_UNDEFINED) {
          return <DashOutlined />;
        }
        return (
          <Button
            size="small"
            style={{ color: '#3C8618', borderColor: '#274916' }}
            icon={<CheckOutlined />}
            disabled
            title="Client-to-client ACLs are not supported currently"
          />
        );
      }
      // check if acl to a client's assoc ingress has been denied
      if (
        nodeOrClientIdRowTuple[0] === 'client' &&
        clientsMap[nodeOrClientIdRowTuple[1]]?.ingressgatewayid !== nodeOrClientIdColTuple[1]
      ) {
        const clientId = nodeOrClientIdRowTuple[1];
        if (acls[clientId]?.[clientsMap[clientId]?.ingressgatewayid] === ACL_DENIED) {
          return (
            <Badge size="small" dot={originalAclLevel !== newAclLevel}>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                disabled
                title={`Disabled because client's communication to its associated gateway has been blocked`}
              />
            </Badge>
          );
        }
      } else if (
        nodeOrClientIdColTuple[0] === 'client' &&
        clientsMap[nodeOrClientIdColTuple[1]]?.ingressgatewayid !== nodeOrClientIdRowTuple[1]
      ) {
        const clientId = nodeOrClientIdColTuple[1];
        if (acls[clientId]?.[clientsMap[clientId]?.ingressgatewayid] === ACL_DENIED) {
          return (
            <Badge size="small" dot={originalAclLevel !== newAclLevel}>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                disabled
                title={`Disabled because client's communication to its associated gateway has been blocked`}
              />
            </Badge>
          );
        }
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
                  setAcls((prevAcls) => {
                    const newAcls = structuredClone(prevAcls);
                    newAcls[nodeOrClientIdRowTuple[1]][nodeOrClientIdColTuple[1]] = 2;
                    newAcls[nodeOrClientIdColTuple[1]][nodeOrClientIdRowTuple[1]] = 2;
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
                  setAcls((prevAcls) => {
                    const newAcls = structuredClone(prevAcls);
                    newAcls[nodeOrClientIdRowTuple[1]][nodeOrClientIdColTuple[1]] = 1;
                    newAcls[nodeOrClientIdColTuple[1]][nodeOrClientIdRowTuple[1]] = 1;
                    return newAcls;
                  });
                }}
              />
            </Badge>
          );
        default:
          return <DashOutlined />;
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
                cursor: 'pointer',
              }}
              onClick={() => setSearchAclHost(entry.name)}
            >
              {entry.name}
            </Typography.Text>
          );
        },
      },
      ...aclTableDataV2.map((aclData) => ({
        title: aclData.name,
        width: '5rem',
        render(_: unknown, aclEntry: (typeof aclTableDataV2)[0]) {
          // aclEntry => row, aclData => column
          return renderAclValue(
            // original acl status
            originalAcls[aclEntry.nodeOrClientId]?.[aclData.nodeOrClientId] ?? ACL_UNDEFINED,

            // new acl status
            acls[aclEntry.nodeOrClientId]?.[aclData?.nodeOrClientId] ?? ACL_UNDEFINED,

            // node or client IDs
            [aclEntry.type, aclEntry.nodeOrClientId],
            [aclData.type, aclData.nodeOrClientId],
          );
        },
      })),
    ];
  }, [aclTableDataV2, acls, clientsMap, originalAcls]);

  const hasAclsBeenEdited = useMemo(() => JSON.stringify(acls) !== JSON.stringify(originalAcls), [acls, originalAcls]);

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
      return networkNodes.some(
        (node) => `${getExtendedNode(node, store.hostsCommonDetails).name}.${node.network}` === dns.name,
      );
    },
    [networkNodes, store.hostsCommonDetails],
  );

  const isFailoverNodePresentInNetwork = useMemo(() => {
    return networkNodes.some((node) => node.is_fail_over);
  }, [networkNodes]);

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

  const filterByHostHealthStatus = (value: React.Key | boolean, record: Node): boolean => {
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
  };

  const checkIfManagedHostIsLoading = useMemo(() => {
    // check if managed host is loading
    const isNewTenant = store.isNewTenant;
    const isManagedHostLoaded = store.hosts.some((host) => isManagedHost(host.name));
    return isSaasBuild && isNewTenant && !isManagedHostLoaded;
  }, [store.isNewTenant, store.hosts]);

  const jumpToTourStep = useCallback(
    (step: NetworkDetailTourStep) => {
      switch (step) {
        case 'hosts':
          setIsTourOpen(true);
          setActiveTabKey('hosts');
          setTourStep(jumpTourStepObj.hosts);
          break;
        case 'remote-access':
          setIsTourOpen(true);
          setActiveTabKey('clients');
          if (filteredClientGateways.length > 0) {
            setTourStep(jumpTourStepObj.remoteAccess);
          } else {
            setIsAddClientGatewayModalOpen(true);
            setTourStep(jumpTourStepObj.remoteAccess);
          }
          break;
        case 'egress':
          setIsTourOpen(true);
          setTourStep(jumpTourStepObj.egress);
          break;
        case 'relays':
          setIsTourOpen(true);
          setTourStep(jumpTourStepObj.relays);
          break;
        case 'dns':
          setIsTourOpen(true);
          setTourStep(jumpTourStepObj.dns);
          break;
        case 'acls':
          setIsTourOpen(true);
          setTourStep(jumpTourStepObj.acls);
          break;
        case 'metrics':
          setCurrentMetric('connectivity-status');
          setIsTourOpen(true);
          setTourStep(jumpTourStepObj.metrics);
          break;
        case 'vpn-clients':
          setIsTourOpen(true);
          setActiveTabKey('clients');
          setTourStep(jumpTourStepObj.vpnConfigs);
          break;
        default:
          break;
      }
    },
    [jumpTourStepObj],
  );

  const usecase = useMemo(() => {
    if (!networkId) return '';
    return store.networksUsecase[networkId];
  }, [networkId, store.networksUsecase]);

  const onUpdateUsecase = useCallback(
    async (usecase: string) => {
      store.updateNetworkUsecase(networkId!, usecase as NetworkUsecaseString);
    },
    [networkId, store.updateNetworkUsecase],
  );

  // ui components
  const getOverviewContent = useCallback(() => {
    if (!network) return <Skeleton active />;
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card className="overview-card" ref={overviewTabContainerRef}>
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
              <Input placeholder="Network name" disabled={!isEditingNetwork} />
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
                      <Switch disabled={!isEditingNetwork} />
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
                        <Input placeholder="Enter address CIDR (eg: 192.168.1.0/24)" disabled={!isEditingNetwork} />
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
                      <Switch disabled />
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
                        <Input
                          placeholder="Enter address CIDR (eg: 2002::1234:abcd:ffff:c0a8:101/64)"
                          disabled={!isEditingNetwork}
                        />
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
                        disabled
                      ></Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
            {/* TODO: Bring back if needed */}
            {/* <Row
              style={{
                border: `1px solid ${themeToken.colorBorder}`,
                borderRadius: '8px',
                padding: '.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Col xs={24}>
                <Row justify="space-between" align="middle">
                  {!usecase && (
                    <Alert
                      message="Your network is missing a usecase, please add one or if you know your way around you can ignore"
                      type="warning"
                      showIcon
                      style={{ marginBottom: '1rem' }}
                    />
                  )}
                  <Col>Primary usecase for network</Col>
                  <Col md={8}>
                    <Form.Item
                      name="defaultUsecase"
                      style={{ marginBottom: '0px' }}
                      rules={[{ required: false }]}
                      data-nmui-intercom="add-network-form_usecase"
                      initialValue={usecase}
                    >
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        options={Object.keys(networkUsecaseMapText).map((key) => {
                          return { label: networkUsecaseMapText[key as NetworkUsecaseString], value: key };
                        })}
                        onChange={onUpdateUsecase}
                      ></Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row> */}
          </Form>
        </Card>
      </div>
    );
  }, [network, form, isEditingNetwork, themeToken.colorBorder, isIpv4Watch, isIpv6Watch]);

  const getHostsContent = useCallback(() => {
    return (
      <div className="network-hosts-tab-content" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row justify="space-between" style={{ marginBottom: '1rem', width: '100%' }}>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Search hosts"
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
                    label: 'Add New Hosts',
                    onClick() {
                      setIsAddNewHostModalOpen(true);
                    },
                  },
                  {
                    key: 'existing-host',
                    label: 'Add Existing Hosts',
                    onClick() {
                      setIsAddHostsToNetworkModalOpen(true);
                    },
                  },
                ],
              }}
            >
              <Button
                type="primary"
                style={{ width: '170px', marginBottom: '.5rem' }}
                ref={hostsTabContainerAddHostsRef}
              >
                <Space>
                  Add Hosts
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
            <Button
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              onClick={() => jumpToTourStep('hosts')}
              icon={<InfoCircleOutlined />}
            >
              Tour Hosts
            </Button>
            <Button
              title="Go to HOSTS documentation"
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              href={HOSTS_DOCS_URL}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            {checkIfManagedHostIsLoading && (
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
                                color={branding.primaryColor}
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
                ref={hostsTabContainerTableRef}
              />
            </div>
          </Col>
        </Row>
      </div>
    );
  }, [
    searchHost,
    checkIfManagedHostIsLoading,
    isServerEE,
    networkNodes.length,
    isFailoverNodePresentInNetwork,
    network?.isipv4,
    network?.isipv6,
    filteredNetworkNodes,
    jumpToTourStep,
    store.hostsCommonDetails,
    branding.primaryColor,
    editNode,
    confirmNodeFailoverStatusChange,
    disconnectNodeFromNetwork,
    removeNodeFromNetwork,
  ]);

  const getDnsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row justify="space-between" style={{ marginBottom: '1rem', width: '100%' }}>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Search DNS"
              value={searchDns}
              onChange={(ev) => setSearchDns(ev.target.value)}
              prefix={<SearchOutlined />}
              style={{ marginBottom: '.5rem' }}
            />
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => setIsAddDnsModalOpen(true)}
              className="full-width-button-xs mt-10"
              ref={dnsTabAddDNSRef}
              style={{ marginBottom: '.5rem' }}
            >
              <PlusOutlined /> Add DNS
            </Button>
            <Button
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              onClick={() => jumpToTourStep('dns')}
              icon={<InfoCircleOutlined />}
            >
              Take Tour
            </Button>
            <Button
              title="Go to DNS documentation"
              style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
              href={ExternalLinks.CORE_DNS_SETUP_LINK}
              target="_blank"
              icon={<QuestionCircleOutlined />}
            />
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            <div className="table-wrapper">
              <Table
                scroll={{ x: true }}
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
                      const addrs = ([] as Array<string>).concat(dns.address || [], dns.address6 || []).join(', ');
                      return <Typography.Text copyable>{addrs}</Typography.Text>;
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
                              onClick: () => (isDefaultDns(dns) ? undefined : confirmDeleteDns(dns)),
                              danger: true,
                              label: (
                                <Tooltip title={isDefaultDns(dns) ? 'Cannot delete default DNS' : 'Delete DNS'}>
                                  <DeleteOutlined /> Delete
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
                ref={dnsTabDNSTableRef}
              />
            </div>
          </Col>
        </Row>
      </div>
    );
  }, [confirmDeleteDns, dnses, isDefaultDns, jumpToTourStep, searchDns]);

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
            <Col xs={24} xl={(24 * 2) / 3}>
              <Typography.Title level={3} style={{ color: 'white ' }}>
                Remote Access
              </Typography.Title>
              <Typography.Text style={{ color: 'white ' }}>
                Remote Access Gateways enable secure access to your network via Clients. The Gateway forwards traffic
                from the clients into the network, and from the network back to the clients. Clients are simple
                WireGuard config files, supported on most devices. To use Clients, you must configure a Remote Access
                Gateway, which is typically deployed in a public cloud environment, e.g. on a server with a public IP,
                so that it is easily reachable from the Clients. Clients are configured on this dashboard primary via
                client configs{' '}
                <a
                  href="https://www.netmaker.io/features/remote-access-gateway"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Learn More
                </a>
              </Typography.Text>
            </Col>
            <Col xs={24} xl={(24 * 1) / 3} style={{ position: 'relative' }}>
              {/* <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Client Config</Typography.Title>
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
                      <PlusOutlined /> Create Client Config
                    </Button>
                  </Col>
                </Row>
              </Card> */}
              <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Remote Access Gateway</Typography.Title>
                <Typography.Text>
                  You will need to create a remote access gateway for your network before you can create a client.
                </Typography.Text>
                <Row style={{ marginTop: '1rem' }}>
                  <Col>
                    <Button type="primary" size="large" onClick={() => setIsAddClientGatewayModalOpen(true)}>
                      <PlusOutlined /> Create Gateway
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {!isEmpty && (
          <>
            <Row>
              {isServerEE && (
                <Row style={{ width: '100%' }}>
                  <Col
                    style={{
                      marginBottom: '1rem',
                      background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
                      padding: '1rem',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      Introducing the Remote Access Client (RAC) - a graphical user interface (GUI) tool designed for
                      convenient connectivity to a Netmaker network. RAC is particularly well-suited for offsite
                      machines requiring access to a Netmaker network and is compatible with Windows, Mac, Linux and
                      mobile (Android, iOS) operating systems.
                    </span>
                    <Button
                      // href={ExternalLinks.RAC_DOWNLOAD_DOCS_LINK}
                      onClick={() => setIsDownloadRemoteAccessClientModalOpen(true)}
                      target="_blank"
                      rel="noreferrer"
                      type="primary"
                      style={{
                        marginLeft: 'auto',
                      }}
                      ref={remoteAccessTabDownloadClientRef}
                    >
                      {' '}
                      Download RAC
                    </Button>
                  </Col>
                </Row>
              )}

              <Row style={{ width: '100%' }}>
                <Col xs={24} xl={12} style={{ marginBottom: '2rem' }}>
                  <Input
                    placeholder="Search gateways"
                    value={searchClientGateways}
                    onChange={(ev) => setSearchClientGateways(ev.target.value)}
                    prefix={<SearchOutlined />}
                    style={{ width: '60%' }}
                  />
                </Col>

                <Col xs={24} xl={12} style={{ marginBottom: '2rem' }}>
                  <Input
                    placeholder="Search clients"
                    value={searchClients}
                    onChange={(ev) => setSearchClients(ev.target.value)}
                    prefix={<SearchOutlined />}
                    style={{ width: '60%' }}
                  />
                </Col>
                <Col xs={24} xl={12}>
                  <Row style={{ width: '100%' }}>
                    <Col xs={24} md={10}>
                      <Typography.Title style={{ marginTop: '0px' }} level={5}>
                        Gateways
                      </Typography.Title>
                    </Col>
                    <Col xs={23} md={13} style={{ textAlign: 'right' }}>
                      <Button
                        type="primary"
                        onClick={() => setIsAddClientGatewayModalOpen(true)}
                        className="full-width-button-xs"
                        ref={remoteAccessTabAddGatewayRef}
                        style={{ marginBottom: '.5rem' }}
                      >
                        <PlusOutlined /> Create Gateway
                      </Button>
                      <Button
                        style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                        onClick={() => jumpToTourStep('remote-access')}
                        icon={<InfoCircleOutlined />}
                      >
                        Take Tour
                      </Button>
                      <Button
                        title="Go to remote access gateways documentation"
                        style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                        href={GATEWAYS_DOCS_URL}
                        target="_blank"
                        icon={<QuestionCircleOutlined />}
                      />
                    </Col>
                  </Row>
                  <Row style={{ marginTop: '1rem' }}>
                    <Col xs={23}>
                      <div className="table-wrapper">
                        <Table
                          columns={gatewaysTableCols}
                          dataSource={filteredClientGateways}
                          rowKey="id"
                          size="small"
                          scroll={{ x: true }}
                          rowClassName={(gateway) => {
                            return gateway.id === selectedGateway?.id ? 'selected-row' : '';
                          }}
                          onRow={(gateway) => {
                            return {
                              onClick: () => {
                                setSelectedGateway(gateway);
                              },
                            };
                          }}
                          ref={remoteAccessTabGatewayTableRef}
                          rowSelection={{
                            type: 'radio',
                            hideSelectAll: true,
                            selectedRowKeys: selectedGateway ? [selectedGateway.id] : [],
                            onSelect: (gateway) => {
                              if (selectedGateway?.id === gateway.id) {
                                setSelectedGateway(null);
                              } else {
                                setSelectedGateway(gateway);
                              }
                            },
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Col>
                <Col xs={24} xl={12}>
                  <>
                    <Row style={{ width: '100%' }}>
                      <Col xs={24} md={12}>
                        <Typography.Title style={{ marginTop: '0px' }} level={5}>
                          VPN Config Files
                        </Typography.Title>
                      </Col>
                      <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                        <Button
                          type="primary"
                          style={{ marginRight: '1rem', marginBottom: '.5rem' }}
                          onClick={() => setIsAddClientModalOpen(true)}
                          className="full-width-button-xs"
                          ref={remoteAccessTabVPNConfigCreateConfigRef}
                        >
                          <PlusOutlined /> Create Config
                        </Button>
                        <Button
                          title="Go to client documentation"
                          style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                          href={CLIENTS_DOCS_URL}
                          target="_blank"
                          icon={<QuestionCircleOutlined />}
                        />
                      </Col>
                    </Row>
                    <Row style={{ marginTop: '1rem', marginBottom: '.5rem' }}>
                      <Col xs={24}>
                        <div className="table-wrapper">
                          <Table
                            columns={clientsTableCols}
                            dataSource={filteredClients}
                            rowKey="clientid"
                            size="small"
                            scroll={{ x: true }}
                            ref={remoteAccessTabVPNConfigTableRef}
                          />
                        </div>
                      </Col>
                    </Row>
                  </>
                </Col>
              </Row>
            </Row>
          </>
        )}
      </div>
    );
  }, [
    isServerEE,
    clients.length,
    clientGateways.length,
    searchClientGateways,
    searchClients,
    gatewaysTableCols,
    filteredClientGateways,
    selectedGateway,
    clientsTableCols,
    filteredClients,
    jumpToTourStep,
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
            <Col xs={24} xl={16}>
              <Typography.Title level={3} style={{ color: 'white ' }}>
                Egress
              </Typography.Title>
              <Typography.Text style={{ color: 'white ' }}>
                Enable devices in your network to communicate with other devices outside the network via egress
                gateways. An office network, home network, data center, or cloud region all become easily accessible via
                the Egress Gateway. You can even set a machine as an Internet Gateway to create a “traditional” VPN{' '}
                <a
                  href="https://www.netmaker.io/features/egress"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  (Learn more)
                </a>
                .
              </Typography.Text>
            </Col>
            <Col xs={24} xl={8} style={{ position: 'relative' }}>
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
                style={{ width: '30%', marginBottom: '.5rem' }}
              />
            </Col>
            <Col xl={12} xs={24}>
              <Row style={{ width: '100%' }}>
                <Col xs={24} md={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Egress Gateways
                  </Typography.Title>
                </Col>
                <Col xs={24} md={11} style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    ref={egressTabAddEgressRef}
                    onClick={() => setIsAddEgressModalOpen(true)}
                    className="full-width-button-xs"
                    style={{ marginBottom: '.5rem' }}
                  >
                    <PlusOutlined /> Create Egress
                  </Button>
                  <Button
                    style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                    onClick={() => jumpToTourStep('egress')}
                    icon={<InfoCircleOutlined />}
                  >
                    Take Tour
                  </Button>
                  <Button
                    title="Go to egress documentation"
                    style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                    href={EGRESS_DOCS_URL}
                    target="_blank"
                    icon={<QuestionCircleOutlined />}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <div className="table-wrapper">
                    <Table
                      columns={egressTableCols}
                      dataSource={filteredEgresses}
                      rowKey="id"
                      size="small"
                      scroll={{ x: true }}
                      rowClassName={(egress) => {
                        return egress.id === filteredEgress?.id ? 'selected-row' : '';
                      }}
                      onRow={(egress) => {
                        return {
                          onClick: () => {
                            setFilteredEgress(egress);
                          },
                        };
                      }}
                      ref={egressTabEgressTableRef}
                      rowSelection={{
                        type: 'radio',
                        hideSelectAll: true,
                        selectedRowKeys: filteredEgress ? [filteredEgress.id] : [],
                        onSelect: (record, selected) => {
                          if (!selected) return;
                          if (filteredEgress?.id === record.id) {
                            setFilteredEgress(null);
                          } else {
                            setFilteredEgress(record);
                          }
                        },
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
            <Col xl={12} xs={24}>
              <Row style={{ width: '100%' }}>
                <Col xs={24} md={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    External routes
                  </Typography.Title>
                </Col>
                <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                  {filteredEgress && (
                    <Button
                      type="primary"
                      style={{ marginRight: '1rem', marginBottom: '.5rem' }}
                      onClick={() => setIsUpdateEgressModalOpen(true)}
                      className="full-width-button-xs"
                      ref={egressTabAddExternalRouteRef}
                    >
                      <PlusOutlined /> Add external route
                    </Button>
                  )}
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={24}>
                  <div className="table-wrapper">
                    <Table
                      columns={externalRoutesTableCols}
                      dataSource={filteredExternalRoutes}
                      rowKey={(range) => `${range.node?.name ?? ''}-${range.range}`}
                      scroll={{ x: true }}
                      size="small"
                      ref={egressTabExternalRoutesTableRef}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </div>
    );
  }, [
    egresses.length,
    searchEgress,
    egressTableCols,
    filteredEgresses,
    filteredEgress,
    externalRoutesTableCols,
    filteredExternalRoutes,
    jumpToTourStep,
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
            <Col xs={24} xl={16}>
              <Typography.Title level={3} style={{ color: 'white ' }}>
                Relays
              </Typography.Title>
              <Typography.Text style={{ color: 'white ' }}>
                Enable devices in your network to communicate with othererwise unreachable devices with relays.{' '}
                {branding.productName} uses Turn servers to automatically route traffic in these scenarios, but
                sometimes, you’d rather specify which device should be routing the traffic{' '}
                <a
                  href="https://www.netmaker.io/features/relay"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  (Learn More)
                </a>
                .
              </Typography.Text>
            </Col>
            <Col xs={24} xl={8} style={{ position: 'relative' }}>
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
            <Col xs={24} xl={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={24} md={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Relays
                  </Typography.Title>
                </Col>
                <Col xs={24} md={11} style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    ref={relaysTabAddRelayRef}
                    onClick={() => setIsAddRelayModalOpen(true)}
                    className="full-width-button-xs"
                    style={{ marginBottom: '.5rem' }}
                  >
                    <PlusOutlined /> Create Relay
                  </Button>
                  <Button
                    style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                    onClick={() => jumpToTourStep('relays')}
                    icon={<InfoCircleOutlined />}
                  >
                    Tour Relays
                  </Button>
                  <Button
                    title="Go to relays documentation"
                    style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                    href={RELAYS_DOCS_URL}
                    target="_blank"
                    icon={<QuestionCircleOutlined />}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <div className="table-wrapper">
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
                            setSelectedRelay(relay);
                          },
                        };
                      }}
                      scroll={{ x: true }}
                      ref={relaysTabRelayTableRef}
                      rowSelection={{
                        type: 'radio',
                        hideSelectAll: true,
                        selectedRowKeys: selectedRelay ? [selectedRelay.id] : [],
                        onSelect: (record, selected) => {
                          if (!selected) return;
                          if (selectedRelay?.id === record.id) {
                            setSelectedRelay(null);
                          } else {
                            setSelectedRelay(record);
                          }
                        },
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
            <Col xs={24} xl={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={24} md={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Relayed Hosts
                  </Typography.Title>
                </Col>
                <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                  {selectedRelay && (
                    <Button
                      type="primary"
                      style={{ marginRight: '1rem', marginBottom: '.5rem' }}
                      onClick={() => setIsUpdateRelayModalOpen(true)}
                      className="full-width-button-xs"
                      ref={relaysTabAddRelayedNodesRef}
                    >
                      <PlusOutlined /> Add relayed host
                    </Button>
                  )}
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={24}>
                  <div className="table-wrapper">
                    <Table
                      columns={relayedTableCols}
                      dataSource={filteredRelayedNodes}
                      rowKey="id"
                      size="small"
                      scroll={{ x: true }}
                      ref={relaysTabRelayedHostsTableRef}
                    />
                  </div>
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
    jumpToTourStep,
    relayTableCols,
    relayedTableCols,
    relays.length,
    searchRelay,
    selectedRelay,
  ]);

  const getAclsContent = useCallback(() => {
    return (
      <>
        <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {networkHosts.length + clients.length > 50 ? (
            <Row style={{ width: '100%' }}>
              <Col xs={24}>
                <Alert
                  message="Too many ACLs to display"
                  description={
                    <>
                      Please use{' '}
                      <a rel="no-referrer noreferrer" href="https://docs.netmaker.io/nmctl.html#acls" target="_blank">
                        NMCTL
                      </a>{' '}
                      our commandline tool to manage ACLs.
                    </>
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: '1rem' }}
                />
              </Col>
            </Row>
          ) : (
            <Row style={{ width: '100%' }}>
              <Col xl={12} xs={24}>
                <Input
                  allowClear
                  placeholder="Search host"
                  value={searchAclHost}
                  onChange={(ev) => setSearchAclHost(ev.target.value)}
                  prefix={<SearchOutlined />}
                  className="search-acl-host-input"
                />
                {isServerEE && (
                  <span
                    className="show-clients-toggle"
                    data-nmui-intercom="network-details-acls_showclientstoggle"
                    ref={aclTabShowClientAclsRef}
                  >
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
              <Col xl={12} xs={24} className="mt-10 acl-tab-buttons">
                <Button
                  title="Allow All"
                  style={{ marginRight: '1rem', color: '#3C8618', borderColor: '#274916' }}
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setAcls((prevAcls) => {
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
                  }}
                  ref={aclTabAllowAllRef}
                />
                <Button
                  danger
                  title="Block All"
                  style={{ marginRight: '1rem' }}
                  icon={<StopOutlined />}
                  onClick={() => {
                    setAcls((prevAcls) => {
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
                  }}
                  ref={aclTabDenyAllRef}
                />
                <Button
                  title="Reset"
                  style={{ marginRight: '1rem' }}
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setAcls(originalAcls);
                  }}
                  disabled={!hasAclsBeenEdited}
                  ref={aclTabResetRef}
                />
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      if (!networkId) return;
                      setIsSubmittingAcls(true);
                      const newAcls = (await NetworksService.updateAclsV2(networkId, acls)).data;
                      setOriginalAcls(newAcls);
                      setAcls(newAcls);
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
                  ref={aclTabSubmitRef}
                >
                  Submit Changes
                </Button>
                <Button
                  style={{ marginLeft: '1rem' }}
                  onClick={() => jumpToTourStep('acls')}
                  icon={<InfoCircleOutlined />}
                >
                  Take Tour
                </Button>
                <Button
                  title="Go to ACL documentation"
                  style={{ marginLeft: '1rem' }}
                  href={ACLS_DOCS_URL}
                  target="_blank"
                  icon={<QuestionCircleOutlined />}
                />
              </Col>

              <Col xs={24} style={{ paddingTop: '1rem' }}>
                <div className="" style={{ width: '100%', overflow: 'auto' }}>
                  <VirtualisedTable
                    columns={aclTableColsV2}
                    dataSource={filteredAclDataV2}
                    className="acl-table"
                    rowKey="nodeOrClientId"
                    size="small"
                    pagination={false}
                    scroll={{
                      x: '100%',
                    }}
                    ref={aclTabTableRef}
                  />
                </div>
              </Col>
            </Row>
          )}
        </div>
      </>
    );
  }, [
    searchAclHost,
    isServerEE,
    showClientAcls,
    hasAclsBeenEdited,
    isSubmittingAcls,
    aclTableColsV2,
    filteredAclDataV2,
    originalAcls,
    networkId,
    acls,
    notify,
    jumpToTourStep,
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
          <Col xs={24} style={{ width: '100%', height: containerHeight }} ref={graphTabContainerRef}>
            <SigmaContainer
              id={NETWORK_GRAPH_SIGMA_CONTAINER_ID}
              settings={{
                nodeProgramClasses: { image: getNodeImageProgram() },
              }}
              style={{
                backgroundColor: themeToken.colorBgContainer,
                position: 'relative',
              }}
            >
              <NetworkGraph
                network={network}
                hosts={networkHosts}
                nodes={networkNodes}
                acl={originalAcls}
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
  }, [clients, network, networkHosts, networkNodes, originalAcls, themeToken.colorBgContainer]);

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
            <Button onClick={() => jumpToTourStep('metrics')} icon={<InfoCircleOutlined />}>
              Take Tour
            </Button>
          </Col>

          <Col xs={24} style={{ paddingTop: '1rem' }}>
            <div className="" style={{ width: '100%', overflow: 'auto' }}>
              {currentMetric === 'connectivity-status' && (
                <div className="table-wrapper">
                  <Table
                    columns={metricsTableCols}
                    dataSource={connectivityStatusMetricsData}
                    className="connectivity-status-metrics-table"
                    rowKey="nodeId"
                    size="small"
                    pagination={{ pageSize: 100 }}
                    scroll={{ x: true }}
                    ref={metricsTabConnectivityStatusTableRef}
                  />
                </div>
              )}
              {currentMetric === 'latency' && (
                <div className="table-wrapper">
                  <Table
                    columns={metricsTableCols}
                    dataSource={latencyMetricsData}
                    className="latency-metrics-table"
                    rowKey="nodeId"
                    size="small"
                    pagination={{ pageSize: 100 }}
                    scroll={{ x: true }}
                    ref={metricsTabLatencyTableRef}
                  />
                </div>
              )}
              {currentMetric === 'bytes-sent' && (
                <div className="table-wrapper">
                  <Table
                    columns={metricsTableCols}
                    dataSource={bytesSentMetricsData}
                    className="bytes-sent-metrics-table"
                    rowKey="nodeId"
                    size="small"
                    pagination={{ pageSize: 100 }}
                    scroll={{ x: true }}
                    ref={metricsTabBytesSentTableRef}
                  />
                </div>
              )}
              {currentMetric === 'bytes-received' && (
                <div className="table-wrapper">
                  <Table
                    columns={metricsTableCols}
                    dataSource={bytesReceivedMetricsData}
                    className="bytes-received-metrics-table"
                    rowKey="nodeId"
                    size="small"
                    pagination={{ pageSize: 100 }}
                    scroll={{ x: true }}
                    ref={metricsTabBytesReceivedTableRef}
                  />
                </div>
              )}
              {currentMetric === 'uptime' && (
                <div className="table-wrapper">
                  <Table
                    columns={metricsTableCols}
                    dataSource={latencyMetricsData}
                    className="latency-metrics-table"
                    rowKey="nodeId"
                    size="small"
                    pagination={{ pageSize: 100 }}
                    scroll={{ x: true }}
                    ref={metricsTabUptimeTableRef}
                  />
                </div>
              )}
              {currentMetric === 'clients' && (
                <div className="table-wrapper">
                  <Table
                    columns={clientMetricsTableCols}
                    dataSource={clientsMetricsData}
                    className="clients-metrics-table"
                    rowKey="node_name"
                    size="small"
                    pagination={{ pageSize: 100 }}
                    scroll={{ x: true }}
                    ref={metricsTabClientsTableRef}
                  />
                </div>
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
    jumpToTourStep,
  ]);

  const networkTabs: TabsProps['items'] = useMemo(() => {
    const tabs: TabsProps['items'] = [
      {
        key: 'hosts',
        label: `Hosts (${networkHosts.length})`,
        children: network && !isRefreshingNetwork ? getHostsContent() : <Skeleton active />,
      },
      {
        key: 'clients',
        label: `Remote Access (${clientGateways.length})`,
        children: network && !isRefreshingNetwork ? getClientsContent() : <Skeleton active />,
      },
      {
        key: 'egress',
        label: `Egress (${egresses.length})`,
        children: network && !isRefreshingNetwork ? getEgressContent() : <Skeleton active />,
      },
      !isSaasBuild
        ? {
            key: 'dns',
            label: `DNS`,
            children: network && !isRefreshingNetwork ? getDnsContent() : <Skeleton active />,
          }
        : ({} as never),
      {
        key: 'access-control',
        label: `Access Control`,
        children: network && !isRefreshingNetwork ? getAclsContent() : <Skeleton active />,
      },
      {
        key: 'graph',
        label: `Graph`,
        children: network && !isRefreshingNetwork ? getGraphContent() : <Skeleton active />,
      },
    ].concat(
      isServerEE
        ? [
            {
              key: 'metrics',
              label: `Metrics`,
              children: network && !isRefreshingNetwork ? getMetricsContent() : <Skeleton active />,
            },
          ]
        : [],
    );

    if (isServerEE) {
      tabs.splice(2, 0, {
        key: 'relays',
        label: `Relays (${relays.length})`,
        children: network && !isRefreshingNetwork ? getRelayContent() : <Skeleton active />,
      });
      tabs.splice(4, 0, {
        key: 'internet-gateways',
        label: <Typography.Text>Internet Gateways ({internetGatewaysCount})</Typography.Text>,
        children:
          network && !isRefreshingNetwork ? (
            <InternetGatewaysPage
              network={network}
              activeTabKey={activeTabKey}
              internetGatewaysTableRef={internetGatewaysTableRef}
              createInternetGatewayButtonRef={createInternetGatewayButtonRef}
              internetGatewaysConnectedHostsTableRef={internetGatewaysConnectedHostsTableRef}
              internetGatewaysUpdateConnectedHostsRef={internetGatewaysUpdateConnectedHostsRef}
              createInternetGatewayModalSelectHostRef={createInternetGatewayModalSelectHostRef}
              createInternetGatewayModalSelectConnectedHostsRef={createInternetGatewayModalSelectConnectedHostsRef}
              updateInternetGatewayModalSelectConnectedHostsRef={updateInternetGatewayModalSelectConnectedHostsRef}
              isAddInternetGatewayModalOpen={isAddInternetGatewayModalOpen}
              setIsAddInternetGatewayModalOpen={setIsAddInternetGatewayModalOpen}
            />
          ) : (
            <Skeleton active />
          ),
      });
    }

    tabs.push({
      key: 'overview',
      label: `Info`,
      children: network && !isRefreshingNetwork ? getOverviewContent() : <Skeleton active />,
    });

    return tabs;
  }, [
    network,
    isRefreshingNetwork,
    getOverviewContent,
    networkHosts.length,
    getHostsContent,
    clientGateways.length,
    getClientsContent,
    egresses.length,
    getEgressContent,
    getDnsContent,
    getAclsContent,
    getGraphContent,
    isServerEE,
    getMetricsContent,
    relays.length,
    getRelayContent,
    internetGatewaysCount,
  ]);

  const loadMetrics = useCallback(async () => {
    try {
      if (!networkId) return;
      const nodeMetrics = (await NetworksService.getNodeMetrics(networkId)).data;
      setNetworkNodeMetrics(nodeMetrics);
      const clientMetrics = (await NetworksService.getClientMetrics(networkId)).data ?? {};
      setClientMetrics(clientMetrics);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) return;
      notify.error({
        message: 'Error loading host metrics',
        description: extractErrorMsg(err as any),
      });
    }
  }, [networkId, notify]);

  // const loadNetworkNodes = useCallback(async () => {
  //   try {
  //     if (!networkId) return;
  //     const nodes = (await NodesService.getNetworkNodes(networkId)).data;
  //     setNetworkNodes(nodes);
  //   } catch (err) {
  //     if (err instanceof AxiosError && err.response?.status === 403) return;
  //     notify.error({
  //       message: 'Error loading network nodes',
  //       description: extractErrorMsg(err as any),
  //     });
  //   }
  // }, [networkId, notify]);

  const loadNetworkDnses = useCallback(async () => {
    try {
      if (!networkId) return;
      const dnses = (await NetworksService.getDnsesPerNetwork(networkId)).data ?? [];
      setDnses(dnses);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) return;
      notify.error({
        message: 'Error loading network DNS',
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
    // loadNetworkNodes();
    loadNetworkDnses();
    loadAcls();
    loadClients();

    if (isServerEE) {
      loadMetrics();
    }

    setIsLoading(false);
  }, [
    networkId,
    store.networks,
    // loadNetworkNodes,
    loadNetworkDnses,
    loadAcls,
    loadClients,
    isServerEE,
    navigate,
    notify,
    loadMetrics,
  ]);

  const onNetworkFormEdit = useCallback(async () => {
    try {
      const formData = await form.validateFields();
      const network = store.networks.find((network) => network.netid === networkId);
      if (!networkId || !network) {
        throw new Error('Network not found');
      }
      const newNetwork = (
        await NetworksService.updateNetwork(networkId, convertUiNetworkToNetworkPayload({ ...network, ...formData }))
      ).data;
      store.updateNetwork(networkId, convertNetworkPayloadToUiNetwork(newNetwork));
      notify.success({ message: `Network ${networkId} updated` });
      setIsEditingNetwork(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to save changes',
          description: extractErrorMsg(err),
        });
      } else {
        notify.error({
          message: err instanceof Error ? err.message : 'Failed to save changes',
        });
      }
    }
  }, [form, networkId, notify, store]);

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

  const getNetworkSuggestionsBasedOnUsecase = useMemo(() => {
    // find if the current network has a usecase by checking if the network id is a key in the usecase map;
    if (!networkId) return <></>;
    if (!usecase) {
      // no usecase prompty user to add usecase
      return <></>;
    }
    const minimumLimits = networkUsecaseMap[usecase];
    if (!minimumLimits) {
      // no limits for this usecase
    }

    // const current network usage
    const networkUsage: NetworkUsage = {
      nodes: networkNodes.length,
      remoteAccessGateways: clientGateways.length,
      vpnClients: filteredClients.length,
      egressGateways: egresses.length,
      externalRanges: filteredExternalRoutes.length,
      users: 0, //temporal
      relays: relays.length,
    };

    const getUsageValue = (key: keyof NetworkUsage, usage: NetworkUsage) => {
      return usage[key] ?? -1;
    };

    const getActualUsage = () => {
      let count = 0;

      // count the number of items that are less than the minimum limit
      for (const item in minimumLimits) {
        if (
          getUsageValue(item as keyof NetworkUsage, networkUsage) <
          getUsageValue(item as keyof NetworkUsage, minimumLimits)
        ) {
          count++;
        }
      }

      return Object.keys(minimumLimits).length - count;
    };

    const getProgressBarFormat = () => {
      return `${getActualUsage()} of ${Object.keys(minimumLimits).length}`;
    };

    const jumpToUsecaseTourStep = (item: keyof NetworkUsage) => {
      const itemStepMap: ItemStepMap = {
        nodes: 'hosts',
        remoteAccessGateways: 'remote-access',
        vpnClients: 'vpn-clients',
      };

      const step = itemStepMap[item];
      if (step) {
        jumpToTourStep(step);
      } else {
        notify.error({
          message: 'No tour step found for this item',
        });
      }
    };

    const getItemText = (item: keyof NetworkUsage) => {
      // if minimum value is 1 remove trailing s in item text map value so it reads correctly
      const number = getUsageValue(item, minimumLimits);

      const itemTextMap: ItemTextMap = {
        nodes: 'Hosts',
        remoteAccessGateways: 'Remote Access Gateways',
        vpnClients: 'VPN Clients',
        egressGateways: 'Egress Gateways',
        externalRanges: 'External Ranges',
        users: 'Users',
        relays: 'Relays',
      };

      return number === 1 ? (itemTextMap[item]?.slice(0, -1) ?? '') : (itemTextMap[item] ?? '');
    };

    const getSteps = () => {
      const items = Object.keys(minimumLimits).map((key: string) => {
        const item = key as keyof NetworkUsage;
        if (
          getUsageValue(item, minimumLimits) != 0 &&
          getUsageValue(item, networkUsage) < getUsageValue(item, minimumLimits)
        ) {
          return {
            title: 'Waiting',
            description: (
              <>
                {`Your usecase requires at least ${getUsageValue(item, minimumLimits)} ${getItemText(item)}.  `}
                <Button type="default" size="small" onClick={() => jumpToUsecaseTourStep(item)}>
                  Take Tour
                </Button>
              </>
            ),
          };
        } else {
          return {
            title: 'Completed',
            description: `Your usecase requires at least ${getUsageValue(item, minimumLimits)} ${getItemText(item)}.`,
          };
        }
      });

      return items;
    };

    const getUsageStep = () => {
      // loop over minimum limits and find the first index that is less than the actual usage
      return Object.keys(minimumLimits).findIndex((key: string) => {
        const item = key as keyof NetworkUsage;
        if (
          getUsageValue(item, minimumLimits) != 0 &&
          getUsageValue(item, networkUsage) < getUsageValue(item, minimumLimits)
        ) {
          return item;
        }
      });
    };

    const getStepsRemaining = () => {
      const stepsNumber = Object.keys(minimumLimits).length - getActualUsage();

      if (stepsNumber === 1) {
        return '1 step';
      }
      return `${stepsNumber} steps`;
    };

    const toggleFloatingButton = () => {
      setShowFloatingButton(!showFloatingButton);
    };

    return (
      <>
        {showFloatingButton && (
          <FloatButton
            icon={<QuestionCircleOutlined />}
            type="primary"
            style={{ left: store.isSidebarCollapsed ? 90 : 210 }}
            badge={{ dot: true }}
            onClick={toggleFloatingButton}
          />
        )}

        {!showFloatingButton && (
          <Card
            style={{
              width: '400px',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            }}
            className="progress-card"
            title={
              <>
                {' '}
                Network Setup Progress
                <Tooltip title="This is a beta feature that tracks network setup progress based on your network usage.">
                  {' '}
                  <InfoCircleOutlined />{' '}
                </Tooltip>
              </>
            }
            extra={
              <Button type="text" danger onClick={toggleFloatingButton} size="small">
                Close
              </Button>
            }
          >
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Progress
                type="dashboard"
                percent={(getActualUsage() / Object.keys(minimumLimits).length) * 100}
                format={getProgressBarFormat}
                strokeColor={themeToken.colorPrimary}
              />
              <Typography.Text style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                You are {getStepsRemaining()} away from configuring your network for your use case,{' '}
                {`"${networkUsecaseMapText[usecase]}"`}
              </Typography.Text>

              <Steps direction="vertical" size="small" current={getUsageStep()} items={getSteps()} />
            </div>
          </Card>
        )}
      </>
    );
  }, [
    networkId,
    usecase,
    store.isSidebarCollapsed,
    networkNodes.length,
    clientGateways.length,
    filteredClients.length,
    egresses.length,
    filteredExternalRoutes.length,
    relays.length,
    showFloatingButton,
    themeToken.colorPrimary,
    notify,
    jumpToTourStep,
  ]);

  const handleQuickSetupModal = useMemo(() => {
    let showQuickSetupModal = false;

    const toggleFloatingButton = () => {
      showQuickSetupModal = !showQuickSetupModal;
      setShowFloatingButton(!showFloatingButton);
    };

    return (
      <>
        {showFloatingButton && (
          <FloatButton
            icon={<QuestionCircleOutlined />}
            type="primary"
            style={{ left: store.isSidebarCollapsed ? 90 : 210 }}
            badge={{ dot: true }}
            onClick={toggleFloatingButton}
          />
        )}
        {!showFloatingButton && (
          <QuickSetupModal
            isModalOpen={!showFloatingButton}
            notify={notify}
            handleCancel={() => toggleFloatingButton()}
            handleUpgrade={() => true}
            networkId={networkId}
            jumpToTourStep={(ty: TourType) => {}}
          />
        )}
      </>
    );
  }, [showFloatingButton]);

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

  const reloadNetwork = async () => {
    setIsRefreshingNetwork(true);
    await store.fetchHosts();
    await store.fetchNodes();
    loadNetwork();
    setIsRefreshingNetwork(false);
  };

  useEffect(() => {
    // Select the element with the class 'ant-tour'
    const element: HTMLDivElement | null = document.querySelector('.ant-tour');

    // Change the width of the element to 70%
    if (element) {
      element.style.maxWidth = 'auto';
      element.style.width = '900px';
    }
  }, [isTourOpen]);

  useEffect(() => {
    loadNetwork();
    // setIsTourOpen(true);
  }, [loadNetwork]);

  // refresh form to prevent stick network data across different network details pages
  useEffect(() => {
    if (!network) return;
    form.setFieldsValue(network);
  }, [form, network]);

  useEffect(() => {
    if (isInitialLoad) {
      const sortedRelays = filteredRelays.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0));
      const sortedEgresses = filteredEgresses.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0));
      const sortedClientGateways = filteredClientGateways.sort((a, b) =>
        a.name && b.name ? a.name.localeCompare(b.name) : 0,
      );
      setSelectedRelay(sortedRelays[0] ?? null);
      setFilteredEgress(sortedEgresses[0] ?? null);
      setSelectedGateway(sortedClientGateways[0] ?? null);
      setIsInitialLoad(false);
    }
  }, [filteredRelays, filteredEgresses, isInitialLoad, filteredClientGateways]);

  if (!networkId) {
    navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE));
    return null;
  }

  return (
    <>
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
                <Col xs={18} lg={12}>
                  <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                    {network?.netid}
                  </Typography.Title>
                </Col>
                <Col xs={24} lg={12} style={{ textAlign: 'right' }} className="network-details-table-buttons">
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
                  <Button
                    style={{ marginRight: '1em' }}
                    onClick={() => {
                      setActiveTabKey('hosts');
                      setTourStep(0);
                      setIsTourOpen(true);
                    }}
                  >
                    <InfoCircleOutlined /> Take Tour
                  </Button>
                  <Button style={{ marginRight: '1em' }} onClick={reloadNetwork}>
                    <ReloadOutlined /> Reload
                  </Button>
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

              <Tabs
                items={networkTabs}
                activeKey={activeTabKey}
                onChange={(tabKey: string) => {
                  setIsInitialLoad(true);
                  setActiveTabKey(tabKey);
                }}
              />
            </Col>
          </Row>
        </Skeleton>

        {/* tour */}
        <TourComponent
          isTourOpen={isTourOpen}
          setIsTourOpen={setIsTourOpen}
          tourStep={tourStep}
          setTourStep={setTourStep}
          setIsAddClientGatewayModalOpen={setIsAddClientGatewayModalOpen}
          setIsAddClientModalOpen={setIsAddClientModalOpen}
          setIsAddNewHostModalOpen={setIsAddNewHostModalOpen}
          setIsAddEgressModalOpen={setIsAddEgressModalOpen}
          setIsAddDnsModalOpen={setIsAddDnsModalOpen}
          setIsAddRelayModalOpen={setIsAddRelayModalOpen}
          setIsUpdateRelayModalOpen={setIsUpdateRelayModalOpen}
          setActiveTabKey={setActiveTabKey}
          setCurrentMetric={setCurrentMetric}
          setJumpToTourStepObj={setJumpTourStepObj}
          clientGateways={clientGateways}
          relays={relays}
          egresses={egresses}
          notify={notify}
          overviewTabContainerRef={overviewTabContainerRef}
          hostsTabContainerTableRef={hostsTabContainerTableRef}
          hostsTabContainerAddHostsRef={hostsTabContainerAddHostsRef}
          connectHostModalEnrollmentKeysTabRef={connectHostModalEnrollmentKeysTabRef}
          connectHostModalSelectOSTabRef={connectHostModalSelectOSTabRef}
          connectHostModalJoinNetworkTabRef={connectHostModalJoinNetworkTabRef}
          remoteAccessTabGatewayTableRef={remoteAccessTabGatewayTableRef}
          remoteAccessTabAddGatewayRef={remoteAccessTabAddGatewayRef}
          remoteAccessManageUsersRef={remoteAccessManageUsersRef}
          addClientGatewayModalHostRef={addClientGatewayModalHostRef}
          addClientGatewayModalDefaultClientDNSRef={addClientGatewayModalDefaultClientDNSRef}
          addClientGatewayModalIsInternetGatewayRef={addClientGatewayModalIsInternetGatewayRef}
          remoteAccessTabVPNConfigTableRef={remoteAccessTabVPNConfigTableRef}
          remoteAccessTabDisplayAllVPNConfigsRef={remoteAccessTabDisplayAllVPNConfigsRef}
          remoteAccessTabVPNConfigCreateConfigRef={remoteAccessTabVPNConfigCreateConfigRef}
          remoteAccessTabDownloadClientRef={remoteAccessTabDownloadClientRef}
          remoteAccessAddOrRemoveUsersRef={remoteAccessAddOrRemoveUsersRef}
          createClientConfigModalSelectGatewayRef={createClientConfigModalSelectGatewayRef}
          createClientConfigModalClientIDRef={createClientConfigModalClientIDRef}
          createClientConfigModalPublicKeyRef={createClientConfigModalPublicKeyRef}
          createClientConfigModalDNSRef={createClientConfigModalDNSRef}
          createClientConfigModalAdditionalAddressesRef={createClientConfigModalAdditionalAddressesRef}
          createClientConfigModalPostDownRef={createClientConfigModalPostDownRef}
          createClientConfigModalPostUpRef={createClientConfigModalPostUpRef}
          relaysTabRelayTableRef={relaysTabRelayTableRef}
          relaysTabAddRelayRef={relaysTabAddRelayRef}
          createRelayModalSelectHostRef={createRelayModalSelectHostRef}
          relaysTabRelayedHostsTableRef={relaysTabRelayedHostsTableRef}
          relaysTabDisplayAllRelayedHostsRef={relaysTabDisplayAllRelayedHostsRef}
          relaysTabAddRelayedNodesRef={relaysTabAddRelayedNodesRef}
          addRelayedHostModalSelectHostRef={addRelayedHostModalSelectHostRef}
          egressTabEgressTableRef={egressTabEgressTableRef}
          egressTabAddEgressRef={egressTabAddEgressRef}
          createEgressModalSelectHostRef={createEgressModalSelectHostRef}
          createEgressModalEnableNATRef={createEgressModalEnableNATRef}
          createEgressModalSelectExternalRangesRef={createEgressModalSelectExternalRangesRef}
          egressTabExternalRoutesTableRef={egressTabExternalRoutesTableRef}
          egressTabDisplayAllExternalRoutesRef={egressTabDisplayAllExternalRoutesRef}
          egressTabAddExternalRouteRef={egressTabAddExternalRouteRef}
          dnsTabDNSTableRef={dnsTabDNSTableRef}
          dnsTabAddDNSRef={dnsTabAddDNSRef}
          addDNSModalDNSNameRef={addDNSModalDNSNameRef}
          addDNSModalAddressToAliasRef={addDNSModalAddressToAliasRef}
          aclTabTableRef={aclTabTableRef}
          aclTabShowClientAclsRef={aclTabShowClientAclsRef}
          aclTabAllowAllRef={aclTabAllowAllRef}
          aclTabDenyAllRef={aclTabDenyAllRef}
          aclTabResetRef={aclTabResetRef}
          aclTabSubmitRef={aclTabSubmitRef}
          graphTabContainerRef={graphTabContainerRef}
          metricsTabConnectivityStatusTableRef={metricsTabConnectivityStatusTableRef}
          metricsTabLatencyTableRef={metricsTabLatencyTableRef}
          metricsTabBytesSentTableRef={metricsTabBytesSentTableRef}
          metricsTabBytesReceivedTableRef={metricsTabBytesReceivedTableRef}
          metricsTabUptimeTableRef={metricsTabUptimeTableRef}
          metricsTabClientsTableRef={metricsTabClientsTableRef}
          internetGatewaysTableRef={internetGatewaysTableRef}
          createInternetGatewayButtonRef={createInternetGatewayButtonRef}
          internetGatewaysConnectedHostsTableRef={internetGatewaysConnectedHostsTableRef}
          internetGatewaysUpdateConnectedHostsRef={internetGatewaysUpdateConnectedHostsRef}
          createInternetGatewayModalSelectHostRef={createInternetGatewayModalSelectHostRef}
          createInternetGatewayModalSelectConnectedHostsRef={createInternetGatewayModalSelectConnectedHostsRef}
          updateInternetGatewayModalSelectConnectedHostsRef={updateInternetGatewayModalSelectConnectedHostsRef}
          isAddInternetGatewayModalOpen={isAddInternetGatewayModalOpen}
          setIsAddInternetGatewayModalOpen={setIsAddInternetGatewayModalOpen}
          setIsUpdateIngressUsersModalOpen={setIsUpdateIngressUsersModalOpen}
        />
        {/* <Tour
        open={isTourOpen}
        steps={networkDetailsTourStep}
        onClose={() => setIsTourOpen(false)}
        onChange={handleTourOnChange}
        current={tourStep}
      /> */}

        {/* misc */}
        {notifyCtx}
        <AddDnsModal
          isOpen={isAddDnsModalOpen}
          networkId={networkId}
          onCreateDns={onCreateDns}
          onCancel={() => setIsAddDnsModalOpen(false)}
          addDNSModalDNSNameRef={addDNSModalDNSNameRef}
          addDNSModalAddressToAliasRef={addDNSModalAddressToAliasRef}
        />
        <AddClientModal
          key={selectedGateway ? `add-client-${selectedGateway.id}` : 'add-client'}
          isOpen={isAddClientModalOpen}
          networkId={networkId}
          preferredGateway={selectedGateway ?? undefined}
          onCreateClient={() => {
            loadClients();
            store.fetchNodes();
            loadAcls();
            setIsAddClientModalOpen(false);
          }}
          onCancel={() => setIsAddClientModalOpen(false)}
          createClientConfigModalSelectGatewayRef={createClientConfigModalSelectGatewayRef}
          createClientConfigModalClientIDRef={createClientConfigModalClientIDRef}
          createClientConfigModalPublicKeyRef={createClientConfigModalPublicKeyRef}
          createClientConfigModalDNSRef={createClientConfigModalDNSRef}
          createClientConfigModalAdditionalAddressesRef={createClientConfigModalAdditionalAddressesRef}
          createClientConfigModalPostDownRef={createClientConfigModalPostDownRef}
          createClientConfigModalPostUpRef={createClientConfigModalPostUpRef}
          isTourOpen={isTourOpen}
        />
        <AddEgressModal
          isOpen={isAddEgressModalOpen}
          networkId={networkId}
          onCreateEgress={(egress) => {
            store.fetchNodes();
            setFilteredEgress(egress);
            setIsAddEgressModalOpen(false);
          }}
          onCancel={() => setIsAddEgressModalOpen(false)}
          createEgressModalSelectHostRef={createEgressModalSelectHostRef}
          createEgressModalEnableNATRef={createEgressModalEnableNATRef}
          createEgressModalSelectExternalRangesRef={createEgressModalSelectExternalRangesRef}
        />
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
        {targetClient && selectedGateway && (
          <ClientConfigModal
            key={`view-client-config-${targetClient.clientid}`}
            isOpen={isClientConfigModalOpen}
            client={targetClient}
            gateway={selectedGateway}
            onCancel={() => setIsClientConfigModalOpen(false)}
          />
        )}
        {filteredEgress && (
          <UpdateEgressModal
            key={`update-egress-${filteredEgress.id}`}
            isOpen={isUpdateEgressModalOpen}
            networkId={networkId}
            egress={filteredEgress}
            onUpdateEgress={(node: Node) => {
              store.fetchNodes();
              setFilteredEgress(node);
              setIsUpdateEgressModalOpen(false);
            }}
            onCancel={() => setIsUpdateEgressModalOpen(false)}
          />
        )}
        <AddRelayModal
          isOpen={isAddRelayModalOpen}
          networkId={networkId}
          onCreateRelay={(relay) => {
            store.fetchNodes();
            setSelectedRelay(relay);
            setIsAddRelayModalOpen(false);
          }}
          onCancel={() => setIsAddRelayModalOpen(false)}
          createRelayModalSelectHostRef={createRelayModalSelectHostRef}
        />
        {selectedRelay && (
          <UpdateRelayModal
            key={`update-relay-${selectedRelay.id}`}
            isOpen={isUpdateRelayModalOpen}
            relay={selectedRelay}
            networkId={networkId}
            onUpdateRelay={(relay) => {
              store.fetchNodes();
              setSelectedRelay(relay);
              setIsUpdateRelayModalOpen(false);
            }}
            onCancel={() => setIsUpdateRelayModalOpen(false)}
            addRelayedHostModalSelectHostRef={addRelayedHostModalSelectHostRef}
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
          onFinish={(selectedOs?: AvailableOses) => {
            setIsAddNewHostModalOpen(false);
            if (selectedOs === 'mobile') {
              setActiveTabKey('clients');
            }
          }}
          onCancel={() => setIsAddNewHostModalOpen(false)}
          networkId={networkId}
          connectHostModalEnrollmentKeysTabRef={connectHostModalEnrollmentKeysTabRef}
          connectHostModalSelectOSTabRef={connectHostModalSelectOSTabRef}
          connectHostModalJoinNetworkTabRef={connectHostModalJoinNetworkTabRef}
          isTourOpen={isTourOpen}
          tourStep={tourStep}
          page="network-details"
        />
        <AddRemoteAccessGatewayModal
          isOpen={isAddClientGatewayModalOpen}
          networkId={networkId}
          onCreateIngress={(remoteAccessGateway) => {
            store.fetchNodes();
            setSelectedGateway(remoteAccessGateway);
            setIsAddClientGatewayModalOpen(false);
          }}
          onCancel={() => setIsAddClientGatewayModalOpen(false)}
          addClientGatewayModalHostRef={addClientGatewayModalHostRef}
          addClientGatewayModalDefaultClientDNSRef={addClientGatewayModalDefaultClientDNSRef}
          addClientGatewayModalIsInternetGatewayRef={addClientGatewayModalIsInternetGatewayRef}
        />
        {selectedGateway && (
          <UpdateIngressModal
            key={`update-ingress-${selectedGateway.id}`}
            isOpen={isUpdateGatewayModalOpen}
            ingress={selectedGateway}
            networkId={networkId}
            onUpdateIngress={(newNode) => {
              setIsUpdateGatewayModalOpen(false);
              setSelectedGateway(newNode);
            }}
            onCancel={() => setIsUpdateGatewayModalOpen(false)}
          />
        )}
        {selectedGateway && (
          <UpdateIngressUsersModal
            key={`update-ingress-users-${selectedGateway.id}`}
            isOpen={isUpdateIngressUsersModalOpen}
            ingress={selectedGateway}
            networkId={networkId}
            onCancel={() => setIsUpdateIngressUsersModalOpen(false)}
            remoteAccessManageUsersRef={remoteAccessManageUsersRef}
          />
        )}
        {targetClient && (
          <UpdateClientModal
            key={`update-client-${targetClient.clientid}`}
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
        <DownloadRemotesAccessClientModal
          isOpen={isDownloadRemoteAccessClientModalOpen}
          onCancel={() => setIsDownloadRemoteAccessClientModalOpen(false)}
          networkId={networkId}
        />
        <SetNetworkFailoverModal
          isOpen={isSetNetworkFailoverModalOpen}
          networkId={networkId}
          onSetFailover={() => {
            setIsSetNetworkFailoverModalOpen(false);
          }}
          onCancel={() => setIsSetNetworkFailoverModalOpen(false)}
        />
      </Layout.Content>

      {/* {getNetworkSuggestionsBasedOnUsecase} */}
      {handleQuickSetupModal}
    </>
  );
}
