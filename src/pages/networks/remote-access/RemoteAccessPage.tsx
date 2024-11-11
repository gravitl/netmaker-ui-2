import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Typography,
  Input,
  Card,
  Table,
  notification,
  Dropdown,
  TableColumnProps,
  Modal,
  Switch,
  Layout,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { ExtendedNode, Node } from '@/models/Node';
import { ExternalClient } from '@/models/ExternalClient';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { getExtendedNode } from '@/utils/NodeUtils';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';
import { useBranding } from '@/utils/Utils';

// Import your modals here
import AddRemoteAccessGatewayModal from '@/components/modals/add-remote-access-gateway-modal/AddRemoteAccessGatewayModal';
import UpdateIngressModal from '@/components/modals/update-remote-access-gateway-modal/UpdateRemoteAccessGatewayModal';
import ClientDetailsModal from '@/components/modals/client-detaiils-modal/ClientDetailsModal';
import ClientConfigModal from '@/components/modals/client-config-modal/ClientConfigModal';
import AddClientModal from '@/components/modals/add-client-modal/AddClientModal';
import UpdateClientModal from '@/components/modals/update-client-modal/UpdateClientModal';

const GATEWAYS_DOCS_URL = 'https://docs.netmaker.io/docs/remote-access-client-rac';
const CLIENTS_DOCS_URL = 'https://docs.netmaker.io/docs/remote-access-client-rac#adding-clients-to-a-gateway';

export default function RemoteAccessPage() {
  const { selectedNetwork } = useStore((state) => ({
    selectedNetwork: state.selectedNetwork,
  }));
  const networkId = selectedNetwork;
  const store = useStore();
  const branding = useBranding();
  const [notify, notifyCtx] = notification.useNotification();

  // State management
  const [searchClientGateways, setSearchClientGateways] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<Node | null>(null);
  const [isAddClientGatewayModalOpen, setIsAddClientGatewayModalOpen] = useState(false);
  const [isUpdateGatewayModalOpen, setIsUpdateGatewayModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isUpdateClientModalOpen, setIsUpdateClientModalOpen] = useState(false);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [isClientConfigModalOpen, setIsClientConfigModalOpen] = useState(false);
  const [targetClient, setTargetClient] = useState<ExternalClient | null>(null);
  const [clients, setClients] = useState<ExternalClient[]>([]);

  const createClientConfigModalPostUpRef = useRef(null);
  const createClientConfigModalPostDownRef = useRef(null);

  // Fetch network nodes
  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => ({
          ...getExtendedNode(node, store.hostsCommonDetails),
          tableId: node.is_static ? node.static_node.clientid : node.id,
        }))
        .filter((node) => node.network === networkId),
    [store.nodes, store.hostsCommonDetails, networkId],
  );

  // Get client gateways
  const clientGateways = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isingressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  // Filter client gateways based on search
  const filteredClientGateways = useMemo<ExtendedNode[]>(() => {
    return clientGateways.filter(
      (node) => node.name?.toLowerCase().includes(searchClientGateways.toLowerCase()) ?? false,
    );
  }, [clientGateways, searchClientGateways]);

  // Filter clients based on search and selected gateway
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

  // Load clients
  const loadClients = useCallback(async () => {
    try {
      if (!networkId) return;
      const networkClients = (await NodesService.getNetworkExternalClients(networkId)).data ?? [];
      setClients(networkClients);
    } catch (err) {
      notify.error({
        message: 'Error loading clients',
        description: extractErrorMsg(err as any),
      });
    }
  }, [networkId, notify]);

  // Toggle client status
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

  // Delete client confirmation
  const confirmDeleteClient = useCallback(
    (client: ExternalClient) => {
      Modal.confirm({
        title: `Delete client ${client.clientid}`,
        content: 'Are you sure you want to delete this client?',
        onOk: async () => {
          try {
            await NodesService.deleteExternalClient(client.clientid, client.network);
            setClients((prev) => prev.filter((c) => c.clientid !== client.clientid));
            store.fetchNodes();
          } catch (err) {
            notify.error({
              message: 'Error deleting Client',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, store],
  );

  // Delete gateway confirmation
  const confirmDeleteGateway = useCallback(
    (gateway: Node) => {
      Modal.confirm({
        title: `Delete gateway ${getExtendedNode(gateway, store.hostsCommonDetails).name}`,
        content:
          'Are you sure you want to delete this gateway? Any attached clients and remote users will be disconnected.',
        onOk: async () => {
          try {
            await NodesService.deleteIngressNode(gateway.id, gateway.network);
            store.updateNode(gateway.id, { ...gateway, isingressgateway: false });
            store.fetchNodes();
            loadClients();
            notify.success({ message: 'Gateway deleted' });
          } catch (err) {
            notify.error({
              message: 'Error deleting gateway',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [loadClients, notify, store],
  );

  // Gateway table columns
  const gatewaysTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
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
                <b>Private Addresses: </b>
                <br />
                {addrs.map((addr) => (
                  <React.Fragment key={addr}>
                    <Typography.Text copyable style={{ width: 200 }} ellipsis={{ tooltip: addrs }}>
                      {addr}
                    </Typography.Text>
                    <br />
                  </React.Fragment>
                ))}
              </Typography.Paragraph>
              <Typography.Paragraph>
                <b>Endpoints: </b>
                <br />
                {endPointAddrs.map((addr) => (
                  <React.Fragment key={addr}>
                    <Typography.Text copyable style={{ width: 200 }} ellipsis={{ tooltip: endPointAddrs }}>
                      {addr}
                    </Typography.Text>
                    <br />
                  </React.Fragment>
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
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: (
                      <Typography.Text>
                        <EditOutlined /> Edit
                      </Typography.Text>
                    ),
                    onClick: () => {
                      setSelectedGateway(gateway);
                      setIsUpdateGatewayModalOpen(true);
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
                    onClick: () => confirmDeleteGateway(gateway),
                  },
                ],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [store.currentTheme, branding.primaryColorDark, branding.primaryColorLight, confirmDeleteGateway],
  );

  // Clients table columns
  const clientsTableCols = useMemo<TableColumnProps<ExternalClient>[]>(
    () => [
      {
        title: 'ID',
        dataIndex: 'clientid',
        width: 150,
        render(value, client) {
          return (
            <Typography.Link
              onClick={() => {
                setTargetClient(client);
                setIsClientDetailsModalOpen(true);
              }}
            >
              {value}
            </Typography.Link>
          );
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
            <Typography.Text copyable style={{ width: 150 }} ellipsis={{ tooltip: addrs }}>
              {addrs}
            </Typography.Text>
          );
        },
      },
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
          return <Switch checked={value} onChange={(checked) => toggleClientStatus(client, checked)} />;
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
                        disabled={!(store.user && isAdminUserOrRole(store.user)) && store.username !== client.ownerid}
                      >
                        <EditOutlined /> Edit
                      </Typography.Text>
                    ),
                    disabled: !(store.user && isAdminUserOrRole(store.user)) && store.username !== client.ownerid,
                    onClick: () => {
                      setTargetClient(client);
                      setIsUpdateClientModalOpen(true);
                    },
                  },
                  {
                    key: 'view',
                    label: (
                      <Typography.Text
                        disabled={!(store.user && isAdminUserOrRole(store.user)) && store.username !== client.ownerid}
                      >
                        <EyeOutlined /> View Config
                      </Typography.Text>
                    ),
                    disabled: !(store.user && isAdminUserOrRole(store.user)) && store.username !== client.ownerid,
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
                    disabled: !(store.user && isAdminUserOrRole(store.user)) && store.username !== client.ownerid,
                    onClick: () => confirmDeleteClient(client),
                  },
                ],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ],
    [networkNodes, store.hostsCommonDetails, store.user, store.username, confirmDeleteClient, toggleClientStatus],
  );

  // Load initial data
  useEffect(() => {
    if (networkId) {
      loadClients();
    }
  }, [networkId, loadClients]);

  return (
    <Layout.Content style={{ padding: 24 }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row style={{ width: '100%' }}>
          {/* Header content for empty state */}
          {clients.length === 0 && clientGateways.length === 0 && (
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
                width: '100%',
              }}
            >
              <Col xs={24} xl={16}>
                <Typography.Title level={3} style={{ color: 'white' }}>
                  Remote Access
                </Typography.Title>
                <Typography.Text style={{ color: 'white' }}>
                  Remote Access Gateways enable secure access to your network via Clients. The Gateway forwards traffic
                  from the clients into the network, and from the network back to the clients. Clients are simple
                  WireGuard config files, supported on most devices. To use Clients, you must configure a Remote Access
                  Gateway, which is typically deployed in a public cloud environment, e.g. on a server with a public IP,
                  so that it is easily reachable from the Clients.{' '}
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
              <Col xs={24} xl={8} style={{ position: 'relative' }}>
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

          {/* Main content when there are gateways or clients */}
          {(clients.length > 0 || clientGateways.length > 0) && (
            <>
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

                {/* Gateways Section */}
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
                          rowClassName={(gateway) => (gateway.id === selectedGateway?.id ? 'selected-row' : '')}
                          onRow={(gateway) => ({
                            onClick: () => setSelectedGateway(gateway),
                          })}
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

                {/* Clients Section */}
                <Col xs={24} xl={12}>
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
                        href={CLIENTS_DOCS_URL}
                        target="_blank"
                        icon={<QuestionCircleOutlined />}
                      />
                    </Col>
                  </Row>
                  <Row style={{ marginTop: '1rem' }}>
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
                </Col>
              </Row>
            </>
          )}
        </Row>
      </div>

      {/* Modals */}
      <AddRemoteAccessGatewayModal
        isOpen={isAddClientGatewayModalOpen}
        networkId={networkId ?? ''}
        onCreateIngress={(gateway) => {
          store.fetchNodes();
          setSelectedGateway(gateway);
          setIsAddClientGatewayModalOpen(false);
        }}
        onCancel={() => setIsAddClientGatewayModalOpen(false)}
      />

      {selectedGateway && (
        <UpdateIngressModal
          key={`update-ingress-${selectedGateway.id}`}
          isOpen={isUpdateGatewayModalOpen}
          ingress={selectedGateway}
          networkId={networkId ?? ''}
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
        networkId={networkId ?? ''}
        preferredGateway={selectedGateway ?? undefined}
        onCreateClient={() => {
          loadClients();
          store.fetchNodes();
          setIsAddClientModalOpen(false);
        }}
        onCancel={() => setIsAddClientModalOpen(false)}
        createClientConfigModalPostUpRef={createClientConfigModalPostUpRef}
        createClientConfigModalPostDownRef={createClientConfigModalPostDownRef}
      />

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

          <UpdateClientModal
            key={`update-client-${targetClient.clientid}`}
            isOpen={isUpdateClientModalOpen}
            client={targetClient}
            networkId={networkId ?? ''}
            onUpdateClient={() => {
              loadClients();
              setIsUpdateClientModalOpen(false);
            }}
            onCancel={() => setIsUpdateClientModalOpen(false)}
          />

          {selectedGateway && (
            <ClientConfigModal
              key={`view-client-config-${targetClient.clientid}`}
              isOpen={isClientConfigModalOpen}
              client={targetClient}
              gateway={selectedGateway}
              onCancel={() => setIsClientConfigModalOpen(false)}
            />
          )}
        </>
      )}

      {notifyCtx}
    </Layout.Content>
  );
}
