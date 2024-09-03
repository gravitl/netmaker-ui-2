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
import './AddInternetGatewayModal.styles.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined, DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { useServerLicense } from '@/utils/Utils';

interface AddInternetGatewayModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateInternetGateway: (newNode: Node) => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  selectHostRef?: React.RefObject<HTMLDivElement>;
  selectConnectedHostsRef?: React.RefObject<HTMLDivElement>;
}

const nodeIdFormName = 'nodeid';

type AddInternetGatewayFormFields = {
  [nodeIdFormName]: Node['id'];
};

export default function AddInternetGatewayModal({
  isOpen,
  onCreateInternetGateway,
  onCancel,
  networkId,
  selectConnectedHostsRef,
  selectHostRef,
}: AddInternetGatewayModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const { isServerEE } = useServerLicense();
  const [form] = Form.useForm<AddInternetGatewayFormFields>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<ExtendedNode | null>(null);
  const [selectedConnectedHostsIds, setSelectedConnectedHostsIds] = useState<Node['id'][]>([]);
  const [connectedHostsSearch, setConnectedHostsSearch] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);

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
    return !node.isinternetgateway && !node.internetgw_node_id;
  };

  const filteredNetworkNodes = useMemo(
    () => networkNodes.filter((node) => node.name?.toLowerCase().includes(gatewaySearch.toLowerCase())),
    [networkNodes, gatewaySearch],
  );

  const gatewayTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => {
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

  const connectedHostTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => gatewayTableCols, [gatewayTableCols]);

  const resetModal = () => {
    form.resetFields();
    setGatewaySearch('');
    setConnectedHostsSearch('');
    setSelectedGateway(null);
    setSelectedConnectedHostsIds([]);
  };

  const createInternetGateway = async () => {
    try {
      await form.validateFields();
      setIsSubmitting(true);

      if (!selectedGateway) return;

      const newNode = (
        await NodesService.createInternetGateway(selectedGateway.id, networkId, {
          inet_node_client_ids: selectedConnectedHostsIds,
        })
      ).data;
      resetModal();
      onCreateInternetGateway(newNode);
      notify.success({ message: 'Internet gateway created' });
    } catch (err) {
      notify.error({
        message: 'Failed to create internet gateway',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create an Internet Gateway</span>}
      open={isServerEE && isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal AddInternetGatewayModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-internet-gateway-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <div ref={selectHostRef}>
            <Form.Item
              label="Select host (Linux only)"
              name={nodeIdFormName}
              rules={[{ required: true, message: 'Please select a host' }]}
              data-nmui-intercom="add-internet-gateway-form_nodeid"
            >
              {!selectedGateway && (
                <Select
                  placeholder="Select host"
                  dropdownRender={() => (
                    <div style={{ padding: '.5rem' }}>
                      <Row style={{ marginBottom: '1rem' }}>
                        <Col span={8}>
                          <Input
                            placeholder="Search host..."
                            value={gatewaySearch}
                            onChange={(e) => setGatewaySearch(e.target.value)}
                            prefix={<SearchOutlined />}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                          <div className="table-wrapper">
                            <Table
                              size="small"
                              columns={gatewayTableCols}
                              dataSource={filteredNetworkNodes
                                .filter((node) => node.os === 'linux')
                                .sort((a, b) =>
                                  // sort unconnected hosts to the top
                                  !!a.internetgw_node_id && !!b.internetgw_node_id ? 0 : a.internetgw_node_id ? 1 : -1,
                                )}
                              rowKey="id"
                              onRow={(node) => {
                                return {
                                  onClick: () => {
                                    if (!isNodeSelectable(node)) return;
                                    form.setFieldValue(nodeIdFormName, node.id);
                                    setSelectedGateway(node);
                                  },
                                  title: !isNodeSelectable(node)
                                    ? 'Host is already connected to an internet gateway or is an internet gateway itself'
                                    : '',
                                };
                              }}
                              rowClassName={(node) => {
                                return isNodeSelectable(node) ? '' : 'unavailable-row';
                              }}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                  onDropdownVisibleChange={(open) => setIsDropDownOpen(open)}
                  suffixIcon={isDropDownOpen ? <UpOutlined /> : <DownOutlined />}
                />
              )}
              {!!selectedGateway && (
                <>
                  <Row
                    style={{
                      border: `1px solid ${themeToken.colorBorder}`,
                      padding: '.5rem',
                      borderRadius: '8px',
                    }}
                  >
                    <Col span={6}>{selectedGateway?.name ?? ''}</Col>
                    <Col span={6}>{selectedGateway?.address ?? ''}</Col>
                    <Col span={6}>{selectedGateway?.endpointip ?? ''}</Col>
                    <Col span={5}>{selectedGateway && getNodeConnectivity(selectedGateway)}</Col>
                    <Col span={1} style={{ textAlign: 'right' }}>
                      <Button
                        danger
                        size="small"
                        title="Unselect"
                        type="primary"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          form.setFieldValue(nodeIdFormName, '');
                          setSelectedGateway(null);
                        }}
                      />
                    </Col>
                  </Row>
                </>
              )}
            </Form.Item>
          </div>
          {selectedGateway && (
            <div ref={selectConnectedHostsRef}>
              <Form.Item
                label="Select hosts to connect (optional)"
                data-nmui-intercom="add-internet-gateway-form_connected-hosts"
                style={{ marginTop: '2rem' }}
              >
                <Select
                  placeholder="Select hosts to provide internet access to"
                  open={isSelectOpen}
                  onDropdownVisibleChange={(visible) => setIsSelectOpen(visible)}
                  dropdownRender={() => (
                    <div style={{ padding: '.5rem' }}>
                      <Row style={{ marginBottom: '1rem' }}>
                        <Col span={8}>
                          <Input
                            placeholder="Search host..."
                            value={connectedHostsSearch}
                            onChange={(e) => setConnectedHostsSearch(e.target.value)}
                          />
                        </Col>
                        <Col span={16} style={{ textAlign: 'end' }}>
                          <Button
                            type="primary"
                            onClick={() => {
                              setIsSelectOpen(false);
                            }}
                          >
                            Done
                          </Button>
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                          <div className="table-wrapper">
                            <Table
                              size="small"
                              columns={connectedHostTableCols}
                              rowKey="id"
                              dataSource={[
                                ...networkNodes
                                  .filter((node) =>
                                    node.name?.toLocaleLowerCase().includes(connectedHostsSearch.toLocaleLowerCase()),
                                  )
                                  .filter((h) => h.id !== selectedGateway.id),
                              ].sort((a, b) =>
                                // sort unconnected hosts to the top
                                !!a.internetgw_node_id && !!b.internetgw_node_id ? 0 : a.internetgw_node_id ? 1 : -1,
                              )}
                              onRow={(node) => {
                                return {
                                  onClick: () => {
                                    if (!isNodeSelectable(node)) return;
                                    setSelectedConnectedHostsIds((prev) => {
                                      const connectedNodesIds = new Set(prev);
                                      if (connectedNodesIds.has(node.id)) {
                                        connectedNodesIds.delete(node.id);
                                      } else {
                                        connectedNodesIds.add(node.id);
                                      }
                                      return [...connectedNodesIds];
                                    });
                                  },
                                  title: !isNodeSelectable(node)
                                    ? 'Host is already connected to an internet gateway or is an internet gateway'
                                    : '',
                                };
                              }}
                              rowClassName={(node) => {
                                if (!isNodeSelectable(node)) return 'unavailable-row';
                                return selectedConnectedHostsIds.includes(node.id) ? 'selected-row' : '';
                              }}
                              rowSelection={{
                                type: 'checkbox',
                                selectedRowKeys: selectedConnectedHostsIds,
                                onChange: (selectedRowKeys) => {
                                  setSelectedConnectedHostsIds(selectedRowKeys as string[]);
                                },
                              }}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                  suffixIcon={isSelectOpen ? <UpOutlined /> : <DownOutlined />}
                />
                <Typography.Text type="secondary">
                  Selected hosts should not be connected to a different internet gateway on a different network.
                </Typography.Text>
              </Form.Item>

              {selectedConnectedHostsIds.map((id) => (
                <Row
                  key={id}
                  style={{
                    border: `1px solid ${themeToken.colorBorder}`,
                    padding: '.5rem',
                    borderRadius: '8px',
                    marginBottom: '.5rem',
                  }}
                >
                  <Col span={11}>{networkNodes.find((n) => n.id === id)?.name ?? ''}</Col>
                  <Col span={6}>{networkNodes.find((n) => n.id === id)?.address ?? ''}</Col>
                  <Col span={6}>{networkNodes.find((n) => n.id === id)?.endpointip ?? ''}</Col>
                  <Col span={1} style={{ textAlign: 'right' }}>
                    <Button
                      danger
                      size="small"
                      title="Unselect"
                      type="primary"
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setSelectedConnectedHostsIds((prev) => prev.filter((i) => i !== id));
                      }}
                    />
                  </Col>
                </Row>
              ))}
            </div>
          )}
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={createInternetGateway}
                loading={isSubmitting}
                data-nmui-intercom="add-internet-gateway-form_submitbtn"
              >
                Create Internet Gateway
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
