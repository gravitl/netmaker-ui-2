import { useState, useCallback, useMemo, useRef } from 'react';
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
  Layout,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { ExtendedNode, Node } from '@/models/Node';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { getExtendedNode } from '@/utils/NodeUtils';

// Import egress-related modals
import AddEgressModal from '@/components/modals/add-egress-modal/AddEgressModal';
import UpdateEgressModal from '@/components/modals/update-egress-modal/UpdateEgressModal';

const EGRESS_DOCS_URL = 'https://docs.netmaker.io/docs/features/egress';

interface ExternalRoutesTableData {
  node: ExtendedNode;
  range: Node['egressgatewayranges'][0];
}

export default function EgressPage() {
  const { selectedNetwork } = useStore((state) => ({
    selectedNetwork: state.selectedNetwork,
  }));
  const networkId = selectedNetwork;
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();

  // State management
  const [searchEgress, setSearchEgress] = useState('');
  const [filteredEgress, setFilteredEgress] = useState<Node | null>(null);
  const [isAddEgressModalOpen, setIsAddEgressModalOpen] = useState(false);
  const [isUpdateEgressModalOpen, setIsUpdateEgressModalOpen] = useState(false);

  const createEgressModalSelectHostRef = useRef(null);
  const createEgressModalEnableNATRef = useRef(null);
  const createEgressModalSelectExternalRangesRef = useRef(null);

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

  // Get egress gateways
  const egresses = useMemo<ExtendedNode[]>(() => {
    return networkNodes
      .filter((node) => node.isegressgateway)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkNodes, store.hostsCommonDetails]);

  // Filter egress gateways based on search
  const filteredEgresses = useMemo<ExtendedNode[]>(() => {
    return egresses.filter((egress) => egress.name?.toLowerCase().includes(searchEgress.toLowerCase()) ?? false);
  }, [egresses, searchEgress]);

  // Get external routes
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

  // Delete egress confirmation
  const confirmDeleteEgress = useCallback(
    (egress: Node) => {
      Modal.confirm({
        title: `Delete egress ${getExtendedNode(egress, store.hostsCommonDetails).name}`,
        content: 'Are you sure you want to delete this egress?',
        onOk: async () => {
          try {
            await NodesService.deleteEgressNode(egress.id, egress.network);
            store.updateNode(egress.id, { ...egress, isegressgateway: false, egressgatewayranges: [] });
            store.fetchNodes();
            setFilteredEgress(null);
            notify.success({ message: 'Egress deleted' });
          } catch (err) {
            notify.error({
              message: 'Error deleting egress',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [notify, store],
  );

  // Delete range confirmation
  const confirmDeleteRange = useCallback(
    (range: ExternalRoutesTableData) => {
      Modal.confirm({
        title: `Delete range ${range.range} from ${range.node?.name ?? ''}`,
        content: 'Are you sure you want to delete this external range?',
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
            notify.error({
              message: 'Error deleting range',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkId, notify, store],
  );

  // Egress table columns
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
          return <Typography.Text>{addrs}</Typography.Text>;
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
                    onClick: () => {
                      setFilteredEgress(egress);
                      setIsUpdateEgressModalOpen(true);
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
                    onClick: () => confirmDeleteEgress(egress),
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
    [confirmDeleteEgress],
  );

  // External routes table columns
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
                    onClick: () => confirmDeleteRange(range),
                  },
                ],
              }}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ];
  }, [confirmDeleteRange]);

  return (
    <Layout.Content style={{ padding: 24 }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Row style={{ width: '100%' }}>
          {egresses.length === 0 ? (
            // Empty state
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
                width: '100%',
              }}
            >
              <Col xs={24} xl={16}>
                <Typography.Title level={3} style={{ color: 'white' }}>
                  Egress
                </Typography.Title>
                <Typography.Text style={{ color: 'white' }}>
                  Enable devices in your network to communicate with other devices outside the network via egress
                  gateways. An office network, home network, data center, or cloud region all become easily accessible
                  via the Egress Gateway. You can even set a machine as an Internet Gateway to create a
                  &quot;traditional&quot; VPN{' '}
                  <a
                    href="https://www.netmaker.io/features/egress"
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
                  <Typography.Title level={3}>Create Egress</Typography.Title>
                  <Typography.Text>
                    Select a device to act as your Egress Gateway. This device must have access to the target network,
                    and must run Linux (for now).
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
          ) : (
            // Main content
            <>
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
                        rowClassName={(egress) => (egress.id === filteredEgress?.id ? 'selected-row' : '')}
                        onRow={(egress) => ({
                          onClick: () => setFilteredEgress(egress),
                        })}
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
            </>
          )}
        </Row>
      </div>

      {/* Modals */}
      <AddEgressModal
        isOpen={isAddEgressModalOpen}
        networkId={networkId ?? ''}
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

      {filteredEgress && (
        <UpdateEgressModal
          key={`update-egress-${filteredEgress.id}`}
          isOpen={isUpdateEgressModalOpen}
          networkId={networkId ?? ''}
          egress={filteredEgress}
          onUpdateEgress={(node) => {
            store.fetchNodes();
            setFilteredEgress(node);
            setIsUpdateEgressModalOpen(false);
          }}
          onCancel={() => setIsUpdateEgressModalOpen(false)}
        />
      )}

      {notifyCtx}
    </Layout.Content>
  );
}
