import AddClientModal from '@/components/modals/add-client-modal/AddClientModal';
import AddRemoteAccessGatewayModal from '@/components/modals/add-remote-access-gateway-modal/AddRemoteAccessGatewayModal';
import ClientConfigModal from '@/components/modals/client-config-modal/ClientConfigModal';
import ClientDetailsModal from '@/components/modals/client-detaiils-modal/ClientDetailsModal';
import RacModal from '@/components/modals/rac-modal/RacModal';
import UpdateClientModal from '@/components/modals/update-client-modal/UpdateClientModal';
import UpdateRemoteAccessGatewayModal from '@/components/modals/update-remote-access-gateway-modal/UpdateRemoteAccessGatewayModal';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import PageLayout from '@/layouts/PageLayout';
import { ExternalClient } from '@/models/ExternalClient';
import { ExtendedNode, Node } from '@/models/Node';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';
import { useBranding, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  QuestionCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { ViewfinderCircleIcon } from '@heroicons/react/24/solid';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Flex,
  Input,
  MenuProps,
  Modal,
  notification,
  Row,
  Spin,
  Switch,
  Table,
  TableColumnProps,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

interface RemoteAccessPageProps {
  networkId?: string;
  isFullScreen: boolean;
}

export default function NetworkRemoteAccessPage({ isFullScreen }: RemoteAccessPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const [notify, notifyCtx] = notification.useNotification();

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [isClientConfigModalOpen, setIsClientConfigModalOpen] = useState(false);
  const [targetClient, setTargetClient] = useState<ExternalClient | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<Node | null>(null);
  const [searchClientGateways, setSearchClientGateways] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [isAddClientGatewayModalOpen, setIsAddClientGatewayModalOpen] = useState(false);
  const [isUpdateGatewayModalOpen, setIsUpdateGatewayModalOpen] = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);
  const [isDownloadRemoteAccessClientModalOpen, setIsDownloadRemoteAccessClientModalOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
  );

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
                  style={{
                    color: store.currentTheme === 'dark' ? branding.primaryColorDark : branding.primaryColorLight,
                  }}
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
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            </Flex>
          );
        },
      },
    ],
    [branding.primaryColorDark, branding.primaryColorLight, getGatewayDropdownOptions, store.currentTheme],
  );

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

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([storeFetchNodes(), loadClients()]);
    } catch (err) {
      notify.error({
        message: 'Error loading data',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadClients, notify, storeFetchNodes]);

  useEffect(() => {
    if (isInitialLoad) {
      loadData().then(() => {
        const sortedClientGateways = filteredClientGateways.sort((a, b) =>
          a.name && b.name ? a.name.localeCompare(b.name) : 0,
        );
        setSelectedGateway(sortedClientGateways[0] ?? null);
      });
      setIsInitialLoad(false);
    }
  }, [filteredClientGateways, isInitialLoad, loadData]);
  const isEmpty = !isLoading && clients.length === 0 && clientGateways.length === 0;

  return (
    <PageLayout
      title="Remote Access"
      isFullScreen
      description={
        <>
          Enable secure remote access to your network through easy-to-deploy gateways.
          <br />
          Generate WireGuard client configurations for any device and manage all remote connections
        </>
      }
      icon={<ViewfinderCircleIcon className=" size-5" />}
    >
      {isLoading ? (
        <Row justify="center" align="middle" style={{ minHeight: '200px' }}>
          <Spin size="large" />
        </Row>
      ) : (
        <>
          {' '}
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
                        style={{ marginBottom: '.5rem' }}
                      >
                        <PlusOutlined /> Create Gateway
                      </Button>
                      {/* <Button
                      style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                      onClick={() => alert('Tour not implemented')}
                      icon={<InfoCircleOutlined />}
                    >
                      Take Tour
                    </Button> */}
                      <Button
                        title="Go to remote access gateways documentation"
                        style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                        href={ExternalLinks.GATEWAYS_DOCS_URL}
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
                        >
                          <PlusOutlined /> Create Config
                        </Button>
                        <Button
                          title="Go to client documentation"
                          style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                          href={ExternalLinks.CLIENTS_DOCS_URL}
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
                          />
                        </div>
                      </Col>
                    </Row>
                  </>
                </Col>
              </Row>
            </Row>
          )}
        </>
      )}

      {/* misc */}
      {notifyCtx}
      <AddRemoteAccessGatewayModal
        isOpen={isAddClientGatewayModalOpen}
        networkId={resolvedNetworkId}
        onCreateIngress={(remoteAccessGateway) => {
          store.fetchNodes();
          setSelectedGateway(remoteAccessGateway);
          setIsAddClientGatewayModalOpen(false);
        }}
        onCancel={() => setIsAddClientGatewayModalOpen(false)}
      />
      {selectedGateway && (
        <UpdateRemoteAccessGatewayModal
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
      <AddClientModal
        key={selectedGateway ? `add-client-${selectedGateway.id}` : 'add-client'}
        isOpen={isAddClientModalOpen}
        networkId={resolvedNetworkId}
        preferredGateway={selectedGateway ?? undefined}
        onCreateClient={() => {
          loadClients();
          store.fetchNodes();
          setIsAddClientModalOpen(false);
        }}
        onCancel={() => setIsAddClientModalOpen(false)}
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
      <RacModal
        isOpen={isDownloadRemoteAccessClientModalOpen}
        // networkId={networkId}
        onClose={() => setIsDownloadRemoteAccessClientModalOpen(false)}
      />
    </PageLayout>
  );
}
