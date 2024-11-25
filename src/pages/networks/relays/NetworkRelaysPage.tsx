import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import UpdateRelayModal from '@/components/modals/update-relay-modal/UpdateRelayModal';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { NULL_NODE } from '@/constants/Types';
import PageLayout from '@/layouts/PageLayout';
import { ExtendedNode } from '@/models/Node';
import { isSaasBuild } from '@/services/BaseService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  MenuProps,
  Modal,
  notification,
  Row,
  Table,
  TableColumnProps,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

interface NetworkRelaysPage {
  networkId?: string;
  isFullScreen: boolean;
}

export default function NetworkRelaysPage({ isFullScreen }: NetworkRelaysPage) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();

  const [selectedRelay, setSelectedRelay] = useState<ExtendedNode | null>(null);
  const [isAddRelayModalOpen, setIsAddRelayModalOpen] = useState(false);
  const [searchRelay, setSearchRelay] = useState('');
  const [isUpdateRelayModalOpen, setIsUpdateRelayModalOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
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
                    danger: true,
                    label: (
                      <>
                        <DeleteOutlined /> Stop being relayed
                      </>
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

  useEffect(() => {
    if (isInitialLoad) {
      const sortedRelays = filteredRelays.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0));
      setSelectedRelay(sortedRelays[0] ?? null);
      setIsInitialLoad(false);
    }
  }, [filteredRelays, isInitialLoad]);

  const isEmpty = relays.length === 0;

  return (
    <PageLayout
      title="Relays"
      isFullScreen
      description={
        <>
          Enable communication between otherwise unreachable devices using strategic relay points.
          <br />
          Configure intelligent traffic routing through designated devices to optimize network connectivity.
        </>
      }
      icon={<ArrowPathIcon className=" size-5" />}
    >
      {isEmpty && (
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
              {branding.productName} uses Turn servers to automatically route traffic in these scenarios, but sometimes,
              you’d rather specify which device should be routing the traffic{' '}
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

      {!isEmpty && (
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
                  onClick={() => setIsAddRelayModalOpen(true)}
                  className="full-width-button-xs"
                  style={{ marginBottom: '.5rem' }}
                >
                  <PlusOutlined /> Create Relay
                </Button>
                <Button
                  style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                  onClick={() => alert('Not implemented')}
                  icon={<InfoCircleOutlined />}
                >
                  Tour Relays
                </Button>
                <Button
                  title="Go to relays documentation"
                  style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                  href={ExternalLinks.RELAYS_DOCS_URL}
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
                  />
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      )}

      {/* misc */}
      {notifyCtx}
      <AddRelayModal
        isOpen={isAddRelayModalOpen}
        networkId={resolvedNetworkId}
        onCreateRelay={(relay) => {
          store.fetchNodes();
          setSelectedRelay(relay);
          setIsAddRelayModalOpen(false);
        }}
        onCancel={() => setIsAddRelayModalOpen(false)}
      />
      {selectedRelay && (
        <UpdateRelayModal
          key={`update-relay-${selectedRelay.id}`}
          isOpen={isUpdateRelayModalOpen}
          relay={selectedRelay}
          networkId={resolvedNetworkId}
          onUpdateRelay={(relay) => {
            store.fetchNodes();
            setSelectedRelay(relay);
            setIsUpdateRelayModalOpen(false);
          }}
          onCancel={() => setIsUpdateRelayModalOpen(false)}
        />
      )}
    </PageLayout>
  );
}
