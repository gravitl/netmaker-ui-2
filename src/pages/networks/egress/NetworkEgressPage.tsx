import AddEgressModal from '@/components/modals/add-egress-modal/AddEgressModal';
import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import UpdateEgressModal from '@/components/modals/update-egress-modal/UpdateEgressModal';
import UpdateRelayModal from '@/components/modals/update-relay-modal/UpdateRelayModal';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { NULL_NODE } from '@/constants/Types';
import { ExtendedNode, Node } from '@/models/Node';
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
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

interface NetworkEgressPageProps {
  networkId?: string;
  isFullScreen: boolean;
}

interface ExternalRoutesTableData {
  node: ExtendedNode;
  range: Node['egressgatewayranges'][0];
}

export default function NetworkEgressPage({ isFullScreen }: NetworkEgressPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [targetEgress, setTargetEgress] = useState<Node | null>(null);
  const [isAddEgressModalOpen, setIsAddEgressModalOpen] = useState(false);
  const [searchEgress, setSearchEgress] = useState('');
  const [isUpdateEgressModalOpen, setIsUpdateEgressModalOpen] = useState(false);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
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
    if (targetEgress) {
      return targetEgress.egressgatewayranges?.map((range) => ({
        node: getExtendedNode(targetEgress, store.hostsCommonDetails),
        range,
      }));
    } else {
      return filteredEgresses
        .flatMap((e) => e.egressgatewayranges?.map((range) => ({ node: e, range })))
        .sort((a, b) => a.node.id.localeCompare(b.node.id));
    }
  }, [targetEgress, filteredEgresses, store.hostsCommonDetails]);

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
            setTargetEgress(null);
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
            setTargetEgress(egressNode);
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
                      setTargetEgress(egress);
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

  // useEffect(() => {
  //   if (isInitialLoad) {
  //     const sortedRelays = filteredRelays.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0));
  //     setSelectedRelay(sortedRelays[0] ?? null);
  //     setIsInitialLoad(false);
  //   }
  // }, [filteredRelays, isInitialLoad]);

  const isEmpty = egresses.length === 0;

  return (
    <div className="NetworkEgressPage" style={{ position: 'relative', height: '100%', padding: isFullScreen ? 0 : 24 }}>
      <div className={`${isFullScreen ? 'page-padding' : ''}`}>
        <Row style={{ marginBottom: '1rem', width: '100%' }}>
          <Col>
            <Typography.Title level={2}>Egress</Typography.Title>
          </Col>
        </Row>
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

        {!isEmpty && (
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
                    onClick={() => setIsAddEgressModalOpen(true)}
                    className="full-width-button-xs"
                    style={{ marginBottom: '.5rem' }}
                  >
                    <PlusOutlined /> Create Egress
                  </Button>
                  <Button
                    style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                    onClick={() => alert('Not implemented yet')}
                    icon={<InfoCircleOutlined />}
                  >
                    Take Tour
                  </Button>
                  <Button
                    title="Go to egress documentation"
                    style={{ marginLeft: '1rem', marginBottom: '.5rem' }}
                    href={ExternalLinks.EGRESS_DOCS_URL}
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
                        return egress.id === targetEgress?.id ? 'selected-row' : '';
                      }}
                      onRow={(egress) => {
                        return {
                          onClick: () => {
                            setTargetEgress(egress);
                          },
                        };
                      }}
                      rowSelection={{
                        type: 'radio',
                        hideSelectAll: true,
                        selectedRowKeys: targetEgress ? [targetEgress.id] : [],
                        onSelect: (record, selected) => {
                          if (!selected) return;
                          if (targetEgress?.id === record.id) {
                            setTargetEgress(null);
                          } else {
                            setTargetEgress(record);
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
                  {targetEgress && (
                    <Button
                      type="primary"
                      style={{ marginRight: '1rem', marginBottom: '.5rem' }}
                      onClick={() => setIsUpdateEgressModalOpen(true)}
                      className="full-width-button-xs"
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
                    />
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </div>

      {/* misc */}
      {notifyCtx}
      <AddEgressModal
        isOpen={isAddEgressModalOpen}
        networkId={resolvedNetworkId}
        onCreateEgress={(egress) => {
          store.fetchNodes();
          setTargetEgress(egress);
          setIsAddEgressModalOpen(false);
        }}
        onCancel={() => setIsAddEgressModalOpen(false)}
      />
      {targetEgress && (
        <UpdateEgressModal
          key={`update-egress-${targetEgress.id}`}
          isOpen={isUpdateEgressModalOpen}
          networkId={resolvedNetworkId}
          egress={targetEgress}
          onUpdateEgress={(node: Node) => {
            store.fetchNodes();
            setTargetEgress(node);
            setIsUpdateEgressModalOpen(false);
          }}
          onCancel={() => setIsUpdateEgressModalOpen(false)}
        />
      )}
    </div>
  );
}
