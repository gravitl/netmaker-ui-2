import AddClientModal from '@/components/modals/add-client-modal/AddClientModal';
import AddDnsModal from '@/components/modals/add-dns-modal/AddDnsModal';
import AddEgressModal from '@/components/modals/add-egress-modal/AddEgressModal';
import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import ClientDetailsModal from '@/components/modals/client-detaiils-modal/ClientDetailsModal';
import UpdateEgressModal from '@/components/modals/update-egress-modal/UpdateEgressModal';
// import { NodeACLContainer } from '@/models/Acl';
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
import { convertNetworkPayloadToUiNetwork, convertUiNetworkToNetworkPayload } from '@/utils/NetworkUtils';
import { getExtendedNode } from '@/utils/NodeUtils';
import { getHostRoute } from '@/utils/RouteUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { DeleteOutlined, ExclamationCircleFilled, MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  Layout,
  MenuProps,
  Modal,
  notification,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  TableColumnProps,
  Tabs,
  TabsProps,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageProps } from '../../models/Page';

import './NetworkDetailsPage.scss';

interface ExternalRoutesTableData {
  node: ExtendedNode;
  range: Node['egressgatewayranges'][0];
}

export default function NetworkDetailsPage(props: PageProps) {
  const { networkId } = useParams<{ networkId: string }>();
  const store = useStore();
  const navigate = useNavigate();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();

  const [form] = Form.useForm<Network>();
  const isIpv4Watch = Form.useWatch('isipv4', form);
  const isIpv6Watch = Form.useWatch('isipv6', form);
  const [network, setNetwork] = useState<Network | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditingNetwork] = useState(false);
  const [searchHost, setSearchHost] = useState('');
  const [searchDns, setSearchDns] = useState('');
  const [dnses, setDnses] = useState<DNS[]>([]);
  const [isAddDnsModalOpen, setIsAddDnsModalOpen] = useState(false);
  // const [acls, setAcls] = useState<NodeACLContainer>({});
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [targetClient, setTargetClient] = useState<ExternalClient | null>(null);
  const [filteredGateway, setFilteredGateway] = useState<Node | null>(null);
  const [filteredEgress, setFilteredEgress] = useState<Node | null>(null);
  const [isAddEgressModalOpen, setIsAddEgressModalOpen] = useState(false);
  const [searchEgress, setSearchEgress] = useState('');
  const [isUpdateEgressModalOpen, setIsUpdateEgressModalOpen] = useState(false);
  const [selectedRelay, setSelectedRelay] = useState<Host | null>(null);
  const [isAddRelayModalOpen, setIsAddRelayModalOpen] = useState(false);
  const [searchRelay, setSearchRelay] = useState('');

  const networkNodes = useMemo(
    () =>
      store.nodes
        .filter((node) => node.network === networkId)
        // TODO: add name search
        .filter((node) => node.address.toLowerCase().includes(searchHost.toLowerCase())),
    [store.nodes, networkId, searchHost]
  );

  const clientGateways = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isingressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const filteredClients = useMemo<ExternalClient[]>(
    () =>
      clients.filter((client) => {
        if (filteredGateway) {
          return client.ingressgatewayid === filteredGateway.id;
        }
        return true;
      }),
    [clients, filteredGateway]
  );

  const egresses = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isegressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  const filteredEgresses = useMemo<ExtendedNode[]>(
    () => egresses.filter((egress) => egress.name?.toLowerCase().includes(searchEgress.toLowerCase()) ?? false),
    [egresses, searchEgress]
  );

  const filteredExternalRoutes = useMemo<ExternalRoutesTableData[]>(() => {
    if (filteredEgress) {
      return filteredEgress.egressgatewayranges.map((range) => ({
        node: getExtendedNode(filteredEgress, store.hostsCommonDetails),
        range,
      }));
    } else {
      return filteredEgresses.flatMap((e) => e.egressgatewayranges.map((range) => ({ node: e, range })));
    }
  }, [filteredEgress, filteredEgresses, store.hostsCommonDetails]);

  const networkHosts = useMemo(() => {
    const hostsMap = new Map<Host['id'], Host>();
    store.hosts.forEach((host) => {
      hostsMap.set(host.id, host);
    });
    return store.nodes.filter((node) => node.network === networkId).map((node) => hostsMap.get(node.hostid)!);
  }, [networkId, store.hosts, store.nodes]);

  const relays = useMemo<Host[]>(() => {
    return networkHosts.filter((host) => host?.isrelay);
  }, [networkHosts]);

  const filteredRelays = useMemo<Host[]>(
    () => relays.filter((relay) => relay.name?.toLowerCase().includes(searchRelay.toLowerCase()) ?? false),
    [relays, searchRelay]
  );

  const filteredRelayedHosts = useMemo<Host[]>(() => {
    if (selectedRelay) {
      return networkHosts.filter((host) => host?.isrelayed && host?.relayed_by === selectedRelay.id);
    } else {
      return networkHosts.filter((host) => host?.isrelayed);
    }
  }, [networkHosts, selectedRelay]);

  const goToNewHostPage = useCallback(() => {
    navigate(AppRoutes.NEW_HOST_ROUTE);
  }, [navigate]);

  const confirmDeleteClient = useCallback(
    (client: ExternalClient) => {
      Modal.confirm({
        title: `Delete client ${client.clientid}`,
        content: `Are you sure you want to delete this client?`,
        onOk: async () => {
          try {
            await NodesService.deleteExternalClient(client.clientid, client.network);
            setClients((prev) => prev.filter((c) => c.clientid !== client.clientid));
            store.fetchNodes();
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting Client',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notify]
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
            store.fetchNodes();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notify]
  );

  const confirmDeleteEgress = useCallback(
    (egress: Node) => {
      Modal.confirm({
        title: `Delete egress ${getExtendedNode(egress, store.hostsCommonDetails).name}`,
        content: `Are you sure you want to delete this egress?`,
        onOk: async () => {
          try {
            await NodesService.deleteEgressNode(egress.id, egress.network);
            store.fetchNodes();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notify]
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
    [networkId, notify, store]
  );

  const confirmDeleteDns = useCallback(
    (dns: DNS) => {
      Modal.confirm({
        title: `Delete DNS ${dns.name}.${dns.network}`,
        content: `Are you sure you want to delete this DNS?`,
        onOk: async () => {
          try {
            await NetworksService.deleteDns(dns.network, dns.name);
            setDnses((dnses) => dnses.filter((dns) => dns.name !== dns.name));
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
    [notify]
  );

  const confirmDeleteRelay = useCallback(
    (relay: Host) => {
      Modal.confirm({
        title: `Delete relay ${relay.name}`,
        content: `Are you sure you want to delete this relay?`,
        onOk: async () => {
          try {
            await HostsService.deleteHostRelay(relay.id);
            store.fetchHosts();
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting relay',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify, store]
  );

  const confirmRemoveRelayed = useCallback(
    (relayed: Host) => {
      Modal.confirm({
        title: `Stop ${relayed.name} from being relayed`,
        content: `Are you sure you want to stop this host from being relayed?`,
        onOk: async () => {
          try {
            // await HostsService.updateHost(relay.id);
            // store.fetchHosts();
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error updating relay',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify]
  );

  const gatewaysTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
        width: 500,
        render(name) {
          return <Typography.Link>{name}</Typography.Link>;
        },
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
        render(_, gateway) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'delete',
                    label: (
                      <Typography.Text onClick={() => confirmDeleteGateway(gateway)}>
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
    [confirmDeleteGateway]
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
                    key: 'delete',
                    label: (
                      <Typography.Text onClick={() => confirmDeleteEgress(egress)}>
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
    [confirmDeleteEgress]
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
        title: 'Allowed IPs',
        // dataIndex: 'address',
        render(_, client) {
          const addrs = `${client.address}, ${client.address6}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Public Key',
        dataIndex: 'publickey',
        width: 200,
        render(value) {
          return (
            <div style={{ width: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value}
            </div>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'enabled',
        render(value) {
          return (
            <Switch
              checked={value}
              // onChange={(checked) => {
              //   const newClients = [...clients];
              //   newClients[index].enabled = checked;
              //   setClients(newClients);
              // }}
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
                    key: 'delete',
                    label: (
                      <Tooltip title="Cannot delete default DNS">
                        <Typography.Text onClick={() => confirmDeleteClient(client)}>
                          <DeleteOutlined /> Delete
                        </Typography.Text>
                      </Tooltip>
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
    [confirmDeleteClient, openClientDetails]
  );

  const relayTableCols = useMemo<TableColumnProps<Host>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, host) {
          const assocNode = networkNodes.find((node) => node.hostid === host.id);
          const addrs = `${assocNode?.address ?? ''}, ${assocNode?.address6 ?? ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
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
                    key: 'delete',
                    label: (
                      <Typography.Text onClick={() => confirmDeleteRelay(relay)}>
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
    [confirmDeleteRelay, networkNodes]
  );

  const relayedTableCols = useMemo<TableColumnProps<Host>[]>(
    () => [
      {
        title: 'Host name',
        dataIndex: 'name',
      },
      {
        title: 'Relayed by',
        render(_, host) {
          return `${networkHosts.find((h) => h.id === host.relayed_by)?.name ?? ''}`;
        },
      },
      {
        title: 'Addresses',
        dataIndex: 'address',
        render(_, host) {
          const assocNode = networkNodes.find((node) => node.hostid === host.id);
          const addrs = `${assocNode?.address ?? ''}, ${assocNode?.address6 ?? ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
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
                      <Typography.Text onClick={() => confirmRemoveRelayed(relayed)}>
                        <DeleteOutlined /> Stop being relayed
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
    [confirmRemoveRelayed, networkHosts, networkNodes]
  );

  // ui components
  const getOverviewContent = useCallback(() => {
    if (!network) return <Skeleton active />;
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card style={{ width: '50%' }}>
          <Form name="network-form" form={form} layout="vertical" initialValues={network} disabled={!isEditing}>
            <Form.Item label="Network name" name="netid" rules={[{ required: true }]}>
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
                    <Form.Item name="isipv4" valuePropName="checked" style={{ marginBottom: '0px' }}>
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                {isIpv4Watch && (
                  <Row>
                    <Col xs={24}>
                      <Form.Item name="addressrange" style={{ marginBottom: '0px' }}>
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
                    <Form.Item name="isipv6" valuePropName="checked" style={{ marginBottom: '0px' }}>
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                {isIpv6Watch && (
                  <Row>
                    <Col xs={24}>
                      <Form.Item name="addressrange6" style={{ marginBottom: '0px' }}>
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
                    <Form.Item name="defaultacl" style={{ marginBottom: '0px' }} rules={[{ required: true }]}>
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

            <Form.Item label="Default Client DNS" name="defaultDns">
              <Input placeholder="Default Client DNS" />
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }, [network, form, isEditing, themeToken.colorBorder, isIpv4Watch, isIpv6Watch]);

  const getHostsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card style={{ width: '100%' }}>
          <Row justify="space-between" style={{ marginBottom: '1rem' }}>
            <Col xs={12} md={8}>
              <Input
                size="large"
                placeholder="Search hosts"
                value={searchHost}
                onChange={(ev) => setSearchHost(ev.target.value)}
              />
            </Col>
            <Col xs={12} md={6} style={{ textAlign: 'right' }}>
              <Button type="primary" size="large" onClick={goToNewHostPage}>
                <PlusOutlined /> Add Host
              </Button>
            </Col>
          </Row>

          <Table
            columns={[
              {
                title: 'Host Name',
                render: (_, node) => {
                  const hostName = store.hostsCommonDetails[node.hostid].name;
                  return <Link to={getHostRoute(hostName)}>{hostName}</Link>;
                },
                sorter: (a, b) => {
                  const hostNameA = store.hostsCommonDetails[a.hostid].name;
                  const hostNameB = store.hostsCommonDetails[b.hostid].name;
                  return hostNameA.localeCompare(hostNameB);
                },
                defaultSortOrder: 'ascend',
              },
              {
                title: 'Private Address',
                dataIndex: 'address',
                render: (address: string, node) => (
                  <>
                    <Typography.Text copyable>{address}</Typography.Text>
                    <Typography.Text copyable={!!node.address6}>{node.address6}</Typography.Text>
                  </>
                ),
              },
              {
                title: 'Public Address',
                dataIndex: 'name',
              },
              {
                title: 'Preferred DNS',
                dataIndex: 'name',
              },
              {
                title: 'Health Status',
                dataIndex: 'name',
              },
              {
                title: 'Connection status',
                // dataIndex: 'name',
              },
            ]}
            dataSource={networkNodes}
            rowKey="id"
          />
        </Card>
      </div>
    );
  }, [goToNewHostPage, networkNodes, searchHost, store.hostsCommonDetails]);

  const getDnsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card style={{ width: '100%' }}>
          <Row justify="space-between" style={{ marginBottom: '1rem' }}>
            <Col xs={12} md={8}>
              <Input
                size="large"
                placeholder="Search DNS"
                value={searchDns}
                onChange={(ev) => setSearchDns(ev.target.value)}
              />
            </Col>
            <Col xs={12} md={6} style={{ textAlign: 'right' }}>
              <Button type="primary" size="large" onClick={() => setIsAddDnsModalOpen(true)}>
                <PlusOutlined /> Add DNS
              </Button>
            </Col>
          </Row>

          <Table
            columns={[
              {
                title: 'DNS Entry',
                render(_, dns) {
                  return <Typography.Text copyable>{`${dns.name}.${dns.network}`}</Typography.Text>;
                },
              },
              {
                title: 'IP Addresses',
                render(_, dns) {
                  return (
                    <Typography.Text copyable>
                      {dns.address}
                      {dns.address6 && `, ${dns.address6}`}
                    </Typography.Text>
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
                          label: (
                            <Tooltip title="Cannot delete default DNS">
                              <Typography.Text onClick={() => confirmDeleteDns(dns)}>
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
            dataSource={dnses}
            rowKey="name"
          />
        </Card>
      </div>
    );
  }, [confirmDeleteDns, dnses, searchDns]);

  const getClientsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {clients.length === 0 && (
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
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque amet modi cum aut doloremque dicta
                reiciendis odit molestias nam animi enim et molestiae consequatur quas quo facere magni, maiores rem.
              </Typography.Text>
            </Col>
            <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
              <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Client</Typography.Title>
                <Typography.Text>
                  Enable remote access to your network with clients. Clients enable you to connect mobile and other
                  devices to your networks.
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

        {clients.length > 0 && (
          <Row style={{ width: '100%' }}>
            <Col xs={12}>
              <Row style={{ width: '100%' }}>
                <Col xs={12}>
                  <Typography.Title style={{ marginTop: '0px' }} level={5}>
                    Gateways
                  </Typography.Title>
                </Col>
                <Col xs={11} style={{ textAlign: 'right' }}>
                  <Button type="primary" onClick={() => setIsAddClientModalOpen(true)}>
                    <PlusOutlined /> Create Client
                  </Button>
                </Col>
              </Row>
              <Row style={{ marginTop: '1rem' }}>
                <Col xs={23}>
                  <Table
                    columns={gatewaysTableCols}
                    dataSource={clientGateways}
                    rowKey="id"
                    size="small"
                    rowClassName={(gateway) => {
                      return gateway.id === filteredGateway?.id ? 'selected-row' : '';
                    }}
                    onRow={(gateway) => {
                      return {
                        onClick: () => {
                          if (filteredGateway?.id === gateway.id) setFilteredGateway(null);
                          else setFilteredGateway(gateway);
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
                  Display All{' '}
                  <Switch
                    title="Display all clients. Click a gateway to filter clients specific to that gateway."
                    checked={filteredGateway === null}
                    onClick={() => {
                      setFilteredGateway(null);
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
  }, [clientGateways, clients, clientsTableCols, filteredClients, filteredGateway, gatewaysTableCols]);

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
                gateways.
              </Typography.Text>
            </Col>
            <Col xs={8} style={{ position: 'relative' }}>
              <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Egress</Typography.Title>
                <Typography.Text>
                  Enable devices in your network to communicate with other devices outside the network via egress
                  gateways.
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
                Enable devices in your network to communicate with othererwise unreachable devices with relays.
              </Typography.Text>
            </Col>
            <Col xs={8} style={{ position: 'relative' }}>
              <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
                <Typography.Title level={3}>Create Relay</Typography.Title>
                <Typography.Text>
                  Enable devices in your network to communicate with otherwise unreachable devices with relays.
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
                      // onClick={() => setIsUpdateEgressModalOpen(true)}
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
                  <Table columns={relayedTableCols} dataSource={filteredRelayedHosts} rowKey="id" size="small" />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </div>
    );
  }, [filteredRelayedHosts, filteredRelays, relayTableCols, relayedTableCols, relays, searchRelay, selectedRelay]);

  const getAclsContent = useCallback(() => {
    return (
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card style={{ width: '100%' }}></Card>
      </div>
    );
  }, []);

  const networkTabs: TabsProps['items'] = useMemo(() => {
    return [
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
        key: 'relays',
        label: `Relays (${relays.length})`,
        children: network ? getRelayContent() : <Skeleton active />,
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
        key: 'metrics',
        label: `Metrics`,
        children: 'Content of Metrics Tab',
      },
    ];
  }, [
    network,
    networkHosts.length,
    clients.length,
    egresses.length,
    relays.length,
    getOverviewContent,
    getHostsContent,
    getClientsContent,
    getEgressContent,
    getRelayContent,
    getDnsContent,
    getAclsContent,
  ]);

  const loadClients = useCallback(async () => {
    try {
      if (!networkId) return;
      const allClients = (await NodesService.getExternalClients()).data;
      const networkClients = allClients.filter((client) => client.network === networkId);
      setClients(networkClients);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Error loading clients',
          description: extractErrorMsg(err),
        });
      }
    }
  }, [networkId, notify]);

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

  // const loadAcls = useCallback(async () => {
  //   try {
  //     if (!networkId) return;
  //     const acls = (await NetworksService.getAcls(networkId)).data;
  //     setAcls(acls);
  //   } catch (err) {
  //     if (err instanceof AxiosError) {
  //       notify.error({
  //         message: 'Error loading ACLs',
  //         description: extractErrorMsg(err),
  //       });
  //     }
  //   }
  // }, [networkId, notify]);

  const loadNetwork = useCallback(() => {
    setIsLoading(true);
    // route to networks if id is not present
    if (!networkId) {
      navigate(AppRoutes.NETWORKS_ROUTE);
    }
    // load from store
    const network = store.networks.find((network) => network.netid === networkId);
    if (!network) {
      notify.error({ message: `Network ${networkId} not found` });
      navigate(AppRoutes.NETWORKS_ROUTE);
      return;
    }
    setNetwork(network);

    // load extra data
    loadDnses();
    // loadAcls();
    loadClients();

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, networkId, notify, store.networks, loadDnses]);

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
      navigate(AppRoutes.NETWORKS_ROUTE);
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
    navigate(AppRoutes.NETWORKS_ROUTE);
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
            <Link to={AppRoutes.NETWORKS_ROUTE}>View All Networks</Link>
            <Row>
              <Col xs={18}>
                <Typography.Title level={2} copyable style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  {network?.netid}
                </Typography.Title>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                {!isEditing && (
                  <Button type="default" style={{ marginRight: '.5rem' }} onClick={() => setIsEditingNetwork(true)}>
                    Edit
                  </Button>
                )}
                {isEditing && (
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
                )}
                <Button type="default" onClick={promptConfirmDelete}>
                  Delete
                </Button>
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
        onCreateClient={() => {
          loadClients();
          store.fetchNodes();
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
          isOpen={isClientDetailsModalOpen}
          client={targetClient}
          // onDeleteClient={() => {
          //   loadClients();
          // }}
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
    </Layout.Content>
  );
}
