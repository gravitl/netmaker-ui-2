import {
  Badge,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Table,
  TableColumnProps,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import './AddRelayModal.styles.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus, isNodeRelay } from '@/utils/NodeUtils';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { CreateNodeRelayDto } from '@/services/dtos/CreateNodeRelayDto';
import { NodesService } from '@/services/NodesService';
import { NULL_NODE } from '@/constants/Types';

interface AddRelayModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateRelay: (newNode: Node) => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const nodeIdFormName = 'nodeid';

type AddRelayFormFields = CreateNodeRelayDto;

export default function AddRelayModal({ isOpen, onCreateRelay, onCancel, networkId }: AddRelayModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [form] = Form.useForm<AddRelayFormFields>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relaySearch, setRelaySearch] = useState('');
  const [selectedRelay, setSelectedRelay] = useState<ExtendedNode | null>(null);
  const [selectedRelayedIds, setSelectedRelayedIds] = useState<Node['id'][]>([]);
  const [relayedSearch, setRelayedSearch] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const networkNodes = useMemo<ExtendedNode[]>(() => {
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => ({ ...node, ...getExtendedNode(node, store.hostsCommonDetails) }));
  }, [networkId, store.hostsCommonDetails, store.nodes]);

  const isNodeSelectable = (node: Node) => {
    return !isNodeRelay(node) && !node.relayedby;
  };

  const filteredNetworkNodes = useMemo(
    () => networkNodes.filter((node) => node.name?.toLowerCase().includes(relaySearch.toLowerCase())),
    [networkNodes, relaySearch],
  );

  const relayTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => {
    return [
      {
        title: 'Select host',
        dataIndex: 'name',
        render(value) {
          return <Typography.Link>{value}</Typography.Link>;
        },
      },
      {
        title: 'Address',
        dataIndex: 'address',
        render(_, node) {
          const addrs = `${node?.address ?? ''} ${node.address6 ? `, ${node.address6}` : ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
    ];
  }, []);

  const relayedTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => relayTableCols, [relayTableCols]);

  const resetModal = () => {
    form.resetFields();
    setRelaySearch('');
    setRelayedSearch('');
    setSelectedRelay(null);
    setSelectedRelayedIds([]);
  };

  const createRelay = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);

      if (!selectedRelay) return;

      const newNode = (
        await NodesService.createRelay(selectedRelay.id, networkId, {
          ...formData,
          netid: networkId,
          relayaddrs: selectedRelayedIds,
        })
      ).data;
      resetModal();
      onCreateRelay(newNode);
      notify.success({ message: `Relay created` });
    } catch (err) {
      notify.error({
        message: 'Failed to create relay',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Relay</span>}
      open={isServerEE && isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal AddRelayModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-relay-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <Form.Item
            label="Select host"
            name={nodeIdFormName}
            rules={[{ required: true }]}
            data-nmui-intercom="add-relay-form_nodeid"
          >
            {!selectedRelay && (
              <Select
                placeholder="Select host"
                dropdownRender={() => (
                  <div style={{ padding: '.5rem' }}>
                    <Row style={{ marginBottom: '1rem' }}>
                      <Col span={8}>
                        <Input
                          placeholder="Search host..."
                          value={relaySearch}
                          onChange={(e) => setRelaySearch(e.target.value)}
                          prefix={<SearchOutlined />}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Table
                          size="small"
                          columns={relayTableCols}
                          dataSource={filteredNetworkNodes}
                          rowKey="id"
                          onRow={(node) => {
                            return {
                              onClick: () => {
                                if (!isNodeSelectable(node)) return;
                                form.setFieldValue(nodeIdFormName, node.id);
                                setSelectedRelay(node);
                              },
                            };
                          }}
                          rowClassName={(node) => {
                            return isNodeSelectable(node) ? '' : 'unavailable-row';
                          }}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              />
            )}
            {!!selectedRelay && (
              <>
                <Row
                  style={{
                    border: `1px solid ${themeToken.colorBorder}`,
                    padding: '.5rem',
                    borderRadius: '8px',
                  }}
                >
                  <Col span={6}>{selectedRelay?.name ?? ''}</Col>
                  <Col span={6}>{selectedRelay?.address ?? ''}</Col>
                  <Col span={6}>{selectedRelay?.endpointip ?? ''}</Col>
                  <Col span={5}>{selectedRelay && getNodeConnectivity(selectedRelay)}</Col>
                  <Col span={1} style={{ textAlign: 'right' }}>
                    <Button
                      danger
                      size="small"
                      type="text"
                      title="Unselect"
                      icon={<CloseOutlined />}
                      onClick={() => {
                        form.setFieldValue(nodeIdFormName, '');
                        setSelectedRelay(null);
                      }}
                    />
                  </Col>
                </Row>
              </>
            )}
          </Form.Item>

          {selectedRelay && (
            <>
              <Form.Item label="Select hosts to relay" required data-nmui-intercom="add-relay-form_relayed">
                <Select
                  placeholder="Select hosts to relay"
                  open={isSelectOpen}
                  onDropdownVisibleChange={(visible) => setIsSelectOpen(visible)}
                  dropdownRender={() => (
                    <div style={{ padding: '.5rem' }}>
                      <Row style={{ marginBottom: '1rem' }}>
                        <Col span={8}>
                          <Input
                            placeholder="Search host..."
                            value={relayedSearch}
                            onChange={(e) => setRelayedSearch(e.target.value)}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                          <Table
                            size="small"
                            columns={relayedTableCols}
                            rowKey="id"
                            dataSource={[
                              ...filteredNetworkNodes
                                .filter(
                                  (node) => node.name?.toLocaleLowerCase().includes(relayedSearch.toLocaleLowerCase()),
                                )
                                .filter((h) => h.id !== selectedRelay.id),
                            ].sort((a, b) =>
                              // sort non-relayed hosts to the top
                              isNodeRelay(a) === isNodeRelay(b) ? 0 : isNodeRelay(a) ? 1 : -1,
                            )}
                            onRow={(node) => {
                              return {
                                onClick: () => {
                                  if (!isNodeSelectable(node)) return;
                                  setSelectedRelayedIds((prev) => {
                                    const relayedNodesIds = new Set(prev);
                                    if (relayedNodesIds.has(node.id)) {
                                      relayedNodesIds.delete(node.id);
                                    } else {
                                      relayedNodesIds.add(node.id);
                                    }
                                    return [...relayedNodesIds];
                                  });
                                  setIsSelectOpen(false);
                                },
                              };
                            }}
                            rowClassName={(node) => {
                              if (!isNodeSelectable(node)) return 'unavailable-row';
                              return selectedRelayedIds.includes(node.id) ? 'selected-row' : '';
                            }}
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                />
              </Form.Item>

              {selectedRelayedIds.map((id) => (
                <Row
                  key={id}
                  style={{
                    border: `1px solid ${themeToken.colorBorder}`,
                    padding: '.5rem',
                    borderRadius: '8px',
                    marginBottom: '.5rem',
                  }}
                >
                  <Col span={6}>{networkNodes.find((n) => n.id === id)?.name ?? ''}</Col>
                  <Col span={6}>{networkNodes.find((n) => n.id === id)?.address ?? ''}</Col>
                  <Col span={6}>{networkNodes.find((n) => n.id === id)?.endpointip ?? ''}</Col>
                  <Col span={5}>{getNodeConnectivity(networkNodes.find((n) => n.id === id) ?? NULL_NODE)}</Col>
                  <Col span={1} style={{ textAlign: 'right' }}>
                    <Button
                      danger
                      size="small"
                      type="text"
                      title="Unselect"
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setSelectedRelayedIds((prev) => prev.filter((i) => i !== id));
                      }}
                    />
                  </Col>
                </Row>
              ))}

              {selectedRelayedIds.length === 0 && (
                <Row>
                  <Col xs={24}>
                    <Typography.Text type="danger">You must select at least one host to be relayed.</Typography.Text>
                  </Col>
                </Row>
              )}
            </>
          )}
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={createRelay}
                loading={isSubmitting}
                data-nmui-intercom="add-relay-form_submitbtn"
              >
                Create Relay
              </Button>
            </Col>
          </Row>
        </div>
      </Form>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
