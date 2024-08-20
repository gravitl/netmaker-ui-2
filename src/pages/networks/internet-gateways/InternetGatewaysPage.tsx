import AddInternetGatewayModal from '@/components/modals/add-internet-gateway-modal/AddInternetGatewayModal';
import UpdateInternetGatewayModal from '@/components/modals/update-internet-gateway-modal/UpdateInternetGatewayModal';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Dropdown, Input, Modal, Row, Table, TableColumnProps, Tooltip, Typography } from 'antd';
import useNotification from 'antd/es/notification/useNotification';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';

interface InternetGatewaysPageProps {
  network: Network;
  activeTabKey: string;
  internetGatewaysTableRef: RefObject<HTMLDivElement>;
  createInternetGatewayButtonRef: RefObject<HTMLDivElement>;
  internetGatewaysConnectedHostsTableRef: RefObject<HTMLDivElement>;
  internetGatewaysUpdateConnectedHostsRef: RefObject<HTMLDivElement>;
  createInternetGatewayModalSelectHostRef: RefObject<HTMLDivElement>;
  createInternetGatewayModalSelectConnectedHostsRef: RefObject<HTMLDivElement>;
  updateInternetGatewayModalSelectConnectedHostsRef: RefObject<HTMLDivElement>;
  isAddInternetGatewayModalOpen: boolean;
  setIsAddInternetGatewayModalOpen: (isOpen: boolean) => void;
}

const INTERNET_GATEWAYS_DOCS_URL = 'https://docs.netmaker.io/pro/internet-gateways.html';

export function InternetGatewaysPage({
  network,
  activeTabKey,
  internetGatewaysTableRef,
  createInternetGatewayButtonRef,
  internetGatewaysConnectedHostsTableRef,
  internetGatewaysUpdateConnectedHostsRef,
  createInternetGatewayModalSelectHostRef,
  createInternetGatewayModalSelectConnectedHostsRef,
  updateInternetGatewayModalSelectConnectedHostsRef,
  isAddInternetGatewayModalOpen,
  setIsAddInternetGatewayModalOpen,
}: InternetGatewaysPageProps) {
  const store = useStore();
  const [notify, notifyCtx] = useNotification();

  const [searchConnectedHosts, setSearchConnectedHosts] = useState('');
  const [searchInternetGateways, setSearchInternetGateways] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<Node | null>(null);
  const [isUpdateInternetGatewayModalOpen, setIsUpdateInternetGatewayModalOpen] = useState(false);

  const networkNodesMap = useMemo(
    () =>
      store.nodes.reduce(
        (acc, node) => {
          if (node.network === network.netid) acc[node.id] = node;
          return acc;
        },
        {} as Record<Node['id'], Node>,
      ),
    [network.netid, store.nodes],
  );

  const networkInternetGateways = useMemo<ExtendedNode[]>(
    () =>
      store.nodes
        .filter((node) => {
          return node.network === network.netid && node.isinternetgateway;
        })
        .map((node) => getExtendedNode(node, store.hostsCommonDetails)),
    [network.netid, store.hostsCommonDetails, store.nodes],
  );

  const networkInternetGatewaysMap = useMemo<Record<Node['id'], ExtendedNode>>(
    () =>
      networkInternetGateways.reduce(
        (acc, gateway) => {
          acc[gateway.id] = gateway;
          return acc;
        },
        {} as Record<Node['id'], ExtendedNode>,
      ),
    [networkInternetGateways],
  );

  const confirmDeleteInternetGateway = useCallback(
    (gateway: ExtendedNode) => {
      Modal.confirm({
        title: `Delete gateway ${gateway.name}`,
        content: `Are you sure you want to delete this internet gateway?`,
        onOk: async () => {
          try {
            await NodesService.deleteInternetGateway(gateway.id, network.netid);
            const newGateway = {
              ...gateway,
              isinternetgateway: false,
              inet_node_req: { inet_node_client_ids: [] },
            };
            store.updateNode(gateway.id, newGateway);
            setSelectedGateway(networkInternetGateways[0] ?? null);
            notify.success({ message: 'Internet gateway deleted' });
          } catch (err) {
            notify.error({
              message: 'Error deleting internet gateway',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [network.netid, store, networkInternetGateways, notify],
  );

  const confirmDisconnectHost = useCallback(
    (host: ExtendedNode) => {
      Modal.confirm({
        title: `Disconnect host ${host.name}`,
        content: `Are you sure you want to disconnect this host from the internet gateway?`,
        onOk: async () => {
          try {
            const assocInetGw = networkInternetGatewaysMap[host.internetgw_node_id];
            const newConnectedHosts =
              assocInetGw.inet_node_req.inet_node_client_ids?.filter((id) => id !== host.id) ?? [];
            await NodesService.updateInternetGateway(assocInetGw.id, network.netid, {
              inet_node_client_ids: newConnectedHosts,
            });
            const newGateway = {
              ...assocInetGw,
              inet_node_req: { inet_node_client_ids: newConnectedHosts },
            };
            store.updateNode(assocInetGw.id, newGateway);
            setSelectedGateway(newGateway);
            store.fetchNodes();
            notify.success({ message: 'Host disconnected' });
          } catch (err) {
            notify.error({
              message: 'Failed to disconnect host',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [network.netid, networkInternetGatewaysMap, notify, store],
  );

  const filteredInternetGateways = useMemo(() => {
    return networkInternetGateways
      .filter((gateway) => {
        return gateway.name?.toLowerCase().includes(searchInternetGateways.toLowerCase());
      })
      .sort((a, b) => a.name?.localeCompare(b.name ?? '') ?? 0);
  }, [networkInternetGateways, searchInternetGateways]);

  const filteredConnectedHosts = useMemo<ExtendedNode[]>(() => {
    if (selectedGateway) {
      return (
        selectedGateway.inet_node_req.inet_node_client_ids?.map((nodeId) =>
          getExtendedNode(networkNodesMap[nodeId], store.hostsCommonDetails),
        ) ?? []
      ).filter((node) => node.name?.toLowerCase().includes(searchConnectedHosts.toLowerCase()));
    }
    return [...new Set(networkInternetGateways.flatMap((gateway) => gateway.inet_node_req.inet_node_client_ids ?? []))]
      .map((nodeId) => getExtendedNode(networkNodesMap[nodeId], store.hostsCommonDetails))
      .filter((node) => node.name?.toLowerCase().includes(searchConnectedHosts.toLowerCase()));
  }, [networkInternetGateways, networkNodesMap, searchConnectedHosts, selectedGateway, store.hostsCommonDetails]);

  const internetGatewaysTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render(name) {
          return (
            <>
              <Typography.Link>{name}</Typography.Link>
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
          const addrs = ([] as Array<string>).concat(node.address || [], node.address6 || []).join(', ');
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
                    key: 'update',
                    label: (
                      <Typography.Text>
                        <EditOutlined /> Update
                      </Typography.Text>
                    ),
                    onClick: (info) => {
                      setSelectedGateway(gateway);
                      setIsUpdateInternetGatewayModalOpen(true);
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
                      confirmDeleteInternetGateway(gateway);
                      info.domEvent.stopPropagation();
                    },
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
    [confirmDeleteInternetGateway],
  );

  const connectedHostsTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render(name) {
          return (
            <>
              <Typography.Link>{name}</Typography.Link>
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
          const addrs = `${node.address}${node.address6 ? `, ${node.address6}` : ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Internet Gateway',
        dataIndex: 'internetgw_node_id',
        render(igId: Node['internetgw_node_id']) {
          return <Typography.Text>{networkInternetGatewaysMap[igId]?.name ?? ''}</Typography.Text>;
        },
      },
      {
        render(_, host) {
          return (
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'disconnect',
                    label: 'Disconnect from gateway',
                    onClick: () => {
                      confirmDisconnectHost(host);
                    },
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
    [confirmDisconnectHost, networkInternetGatewaysMap],
  );

  useEffect(() => {
    if (activeTabKey === 'internet-gateways') {
      const autoSelectedGateway = filteredInternetGateways?.[0] ?? null;
      setSelectedGateway(autoSelectedGateway);
    }
  }, [activeTabKey]);

  const isEmpty = networkInternetGateways.length === 0;

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
              Internet Gateways
            </Typography.Title>
            <Typography.Text style={{ color: 'white ' }}>
              Internet Gateways allows Netmaker to work like a normal VPN. A gateway forwards traffic from the connected
              hosts to the internet and vice versa. Internet gateways can help you to hide your true IP address and
              bypass geo-restrictions.
            </Typography.Text>
          </Col>
          <Col xs={24} xl={(24 * 1) / 3} style={{ position: 'relative' }}>
            <Card className="header-card" style={{ position: 'absolute', width: '100%' }}>
              <Typography.Title level={3}>Setup an Internet Gateway</Typography.Title>
              <Typography.Text>
                Setup an internet gateway to access the internet without revealing your true IP address.
                <br />
                <br />
                Internet gateways behave like tradiitonal VPNs and forward traffic from connected hosts to the internet.
              </Typography.Text>
              <Row style={{ marginTop: '1rem' }}>
                <Col>
                  <Button type="primary" size="large" onClick={() => setIsAddInternetGatewayModalOpen(true)}>
                    <PlusOutlined /> Create Internet Gateway
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
      {!isEmpty && (
        <Row style={{ width: '100%' }}>
          <Col xs={24} xl={12} style={{ marginBottom: '2rem' }}>
            <Input
              placeholder="Search gateways"
              value={searchInternetGateways}
              onChange={(ev) => setSearchInternetGateways(ev.target.value.trim())}
              prefix={<SearchOutlined />}
              style={{ width: '60%' }}
              allowClear
            />
          </Col>
          <Col xs={24} xl={12} style={{ marginBottom: '2rem' }}>
            <Input
              placeholder="Search connected hosts"
              value={searchConnectedHosts}
              onChange={(ev) => setSearchConnectedHosts(ev.target.value.trim())}
              prefix={<SearchOutlined />}
              style={{ width: '60%' }}
              allowClear
            />
          </Col>
          <Col xs={24} xl={12}>
            <Row style={{ width: '100%' }}>
              <Col xs={24} md={12}>
                <Typography.Title style={{ marginTop: '0px' }} level={5}>
                  Gateways
                </Typography.Title>
              </Col>
              <Col xs={23} md={11} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  onClick={() => setIsAddInternetGatewayModalOpen(true)}
                  className="full-width-button-xs"
                  ref={createInternetGatewayButtonRef}
                  style={{ marginBottom: '.5rem' }}
                >
                  <PlusOutlined /> Create Gateway
                </Button>
                <Button
                  title="Go to internet gateways documentation"
                  style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                  href={INTERNET_GATEWAYS_DOCS_URL}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  icon={<QuestionCircleOutlined />}
                />
              </Col>
            </Row>
            <Row style={{ marginTop: '1rem' }}>
              <Col xs={23}>
                <div className="table-wrapper">
                  <Table
                    columns={internetGatewaysTableCols}
                    dataSource={filteredInternetGateways}
                    ref={internetGatewaysTableRef}
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
                        setSelectedGateway(gateway);
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
                  Connected Hosts
                </Typography.Title>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                {selectedGateway && (
                  <Button
                    type="primary"
                    style={{ marginRight: '1rem', marginBottom: '.5rem' }}
                    onClick={() => setIsUpdateInternetGatewayModalOpen(true)}
                    className="full-width-button-xs"
                    ref={internetGatewaysUpdateConnectedHostsRef}
                  >
                    <EditOutlined /> Update Connected Hosts
                  </Button>
                )}
              </Col>
            </Row>
            <Row style={{ marginTop: '1rem' }}>
              <Col xs={24}>
                <div className="table-wrapper">
                  <Table
                    columns={connectedHostsTableCols}
                    dataSource={filteredConnectedHosts}
                    rowKey="id"
                    size="small"
                    scroll={{ x: true }}
                    ref={internetGatewaysConnectedHostsTableRef}
                  />
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      )}

      {/* misc */}
      <AddInternetGatewayModal
        isOpen={isAddInternetGatewayModalOpen}
        networkId={network.netid}
        onCreateInternetGateway={(newNode: Node) => {
          store.updateNode(newNode.id, newNode);
          setSelectedGateway(getExtendedNode(newNode, store.hostsCommonDetails));
          setIsAddInternetGatewayModalOpen(false);
        }}
        onCancel={() => {
          setIsAddInternetGatewayModalOpen(false);
        }}
        selectHostRef={createInternetGatewayModalSelectHostRef}
        selectConnectedHostsRef={createInternetGatewayModalSelectConnectedHostsRef}
      />
      {selectedGateway && (
        <UpdateInternetGatewayModal
          networkId={network.netid}
          key={`update-internet-gateway-${selectedGateway.id}`}
          isOpen={isUpdateInternetGatewayModalOpen}
          internetGateway={selectedGateway}
          onUpdateInternetGateway={(updatedNode: Node) => {
            setSelectedGateway(getExtendedNode(updatedNode, store.hostsCommonDetails));
            store.updateNode(updatedNode.id, updatedNode);
            setIsUpdateInternetGatewayModalOpen(false);
          }}
          onCancel={() => {
            setIsUpdateInternetGatewayModalOpen(false);
          }}
          selectConnectedHostsRef={updateInternetGatewayModalSelectConnectedHostsRef}
        />
      )}
      {notifyCtx}
    </div>
  );
}
