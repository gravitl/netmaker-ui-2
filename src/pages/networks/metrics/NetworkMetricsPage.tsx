import AddDnsModal from '@/components/modals/add-dns-modal/AddDnsModal';
import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import UpdateRelayModal from '@/components/modals/update-relay-modal/UpdateRelayModal';
import NetworkGraph from '@/components/NetworkGraph';
import { NETWORK_GRAPH_SIGMA_CONTAINER_ID } from '@/constants/AppConstants';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { NULL_HOST, NULL_NODE } from '@/constants/Types';
import { NodeAclContainer } from '@/models/Acl';
import { DNS } from '@/models/Dns';
import { ExternalClient } from '@/models/ExternalClient';
import { Host } from '@/models/Host';
import { MetricCategories, NetworkMetrics, NodeOrClientMetric, UptimeNodeMetrics } from '@/models/Metrics';
import { ExtendedNode, Node } from '@/models/Node';
import { isSaasBuild } from '@/services/BaseService';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { renderMetricValue, useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DashOutlined,
} from '@ant-design/icons';
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl, SearchControl } from '@react-sigma/core';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  MenuProps,
  Modal,
  notification,
  Radio,
  Row,
  Skeleton,
  Table,
  TableColumnProps,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import getNodeImageProgram from 'sigma/rendering/webgl/programs/node.image';

interface NetworkMetricsPageProps {
  networkId?: string;
  isFullScreen: boolean;
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

export default function NetworkMetricsPage({ isFullScreen }: NetworkMetricsPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentMetric, setCurrentMetric] = useState<MetricCategories>('connectivity-status');
  const [networkNodeMetrics, setNetworkNodeMetrics] = useState<NetworkMetrics | null>(null);
  const [clientMetrics, setClientMetrics] = useState<Record<ExternalClient['clientid'], NodeOrClientMetric> | null>(
    null,
  );
  const [filteredMetricNodeId, setFilteredMetricNodeId] = useState<Node['id'] | null>(null);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
  );

  const networkHosts = useMemo(() => {
    const hostsMap = new Map<Host['id'], Host>();
    store.hosts.forEach((host) => {
      hostsMap.set(host.id, host);
    });
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => hostsMap.get(node.hostid) ?? NULL_HOST);
  }, [networkId, store.hosts, store.nodes]);

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
          totaltime: nodeConnectivityMap?.[key].totaltime ?? 0,
        };
        return acc;
      }, res);
      return res;
    });
  }, [networkNodeMetrics?.nodes]);

  const clientsMetricsData = useMemo<NodeOrClientMetric[]>(() => {
    return Object.values(clientMetrics ?? {});
  }, [clientMetrics]);

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
            totaltime: data.totaltime ?? 0,
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

  useEffect(() => {
    if (isInitialLoad) {
      loadMetrics();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, loadMetrics]);

  const containerHeight = '78vh';

  return (
    <div
      className="NetworkMetricsPage"
      style={{ position: 'relative', height: '100%', padding: isFullScreen ? 0 : 24 }}
    >
      <div className={`${isFullScreen ? 'page-padding' : ''}`}>
        <Row style={{ marginBottom: '1rem', width: '100%' }}>
          <Col>
            <Typography.Title level={2}>Metrics</Typography.Title>
          </Col>
        </Row>
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
            <Button onClick={() => alert('Not implemented')} icon={<InfoCircleOutlined />}>
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
                  />
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
    </div>
  );
}
