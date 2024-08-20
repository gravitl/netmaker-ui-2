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
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import './UpdateInternetGatewayModal.styles.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { useServerLicense } from '@/utils/Utils';

interface UpdateInternetGatewayModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  internetGateway: ExtendedNode;
  onUpdateInternetGateway: (newNode: Node) => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  selectConnectedHostsRef: React.RefObject<HTMLDivElement>;
}

const nodeIdFormName = 'nodeid';

type UpdateInternetGatewayFormFields = {
  [nodeIdFormName]: Node['id'];
};

export default function UpdateInternetGatewayModal({
  isOpen,
  internetGateway,
  onUpdateInternetGateway,
  onCancel,
  networkId,
  selectConnectedHostsRef,
}: UpdateInternetGatewayModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const { isServerEE } = useServerLicense();
  const [form] = Form.useForm<UpdateInternetGatewayFormFields>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedConnectedHostsIds, setSelectedConnectedHostsIds] = useState<Node['id'][]>([]);
  const [connectedHostsSearch, setConnectedHostsSearch] = useState('');
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
    if (node.isinternetgateway) return false;
    if (node.internetgw_node_id && node.internetgw_node_id !== internetGateway.id) return false;
    return true;
  };

  const initialInternetGatewayHealth = useMemo(() => {
    return getNodeConnectivity(internetGateway);
  }, [internetGateway, getNodeConnectivity]);

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
    setConnectedHostsSearch('');
    setSelectedConnectedHostsIds(internetGateway.inet_node_req.inet_node_client_ids ?? []);
  };

  const updateInternetGateway = async () => {
    try {
      await form.validateFields();
      setIsSubmitting(true);

      const newNode = (
        await NodesService.updateInternetGateway(internetGateway.id, networkId, {
          inet_node_client_ids: selectedConnectedHostsIds,
        })
      ).data;
      onUpdateInternetGateway(newNode);
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

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update an Internet Gateway</span>}
      open={isServerEE && isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal UpdateInternetGatewayModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="update-internet-gateway-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <Row
            style={{
              border: `1px solid ${themeToken.colorBorder}`,
              padding: '.5rem',
              borderRadius: '8px',
            }}
          >
            <Col span={7}>{internetGateway?.name ?? ''}</Col>
            <Col span={6}>{internetGateway?.address ?? ''}</Col>
            <Col span={6}>{internetGateway?.endpointip ?? ''}</Col>
            <Col span={5}>{initialInternetGatewayHealth}</Col>
          </Row>

          <div ref={selectConnectedHostsRef}>
            <Form.Item
              label="Select hosts to connect"
              data-nmui-intercom="update-internet-gateway-form_connected-hosts"
              style={{ marginTop: '1rem' }}
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
                                .filter((h) => h.id !== internetGateway.id),
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
                                  setIsSelectOpen(false);
                                },
                                title: !isNodeSelectable(node)
                                  ? 'Host is already connected to an internet gateway or is an internet gateway itself'
                                  : '',
                              };
                            }}
                            rowClassName={(node) => {
                              if (!isNodeSelectable(node)) return 'unavailable-row';
                              return selectedConnectedHostsIds.includes(node.id) ? 'selected-row' : '';
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
          </div>
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

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={updateInternetGateway}
                loading={isSubmitting}
                data-nmui-intercom="update-internet-gateway-form_submitbtn"
              >
                Update Internet Gateway
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
