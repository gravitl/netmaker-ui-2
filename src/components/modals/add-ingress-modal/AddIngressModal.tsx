import {
  Alert,
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
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus, isHostNatted } from '@/utils/NodeUtils';
import { CloseOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { Host } from '@/models/Host';

interface AddIngressModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateIngress: () => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface AddIngressForm {
  node: Node;
  extclientdns: Node['ingressdns'];
}

export default function AddIngressModal({ isOpen, onCreateIngress, onCancel, networkId }: AddIngressModalProps) {
  const [form] = Form.useForm<AddIngressForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ExtendedNode | null>(null);
  const [gatewaySearch, setGatewaySearch] = useState('');

  const networkHosts = useMemo<ExtendedNode[]>(() => {
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkId, store.hostsCommonDetails, store.nodes]);

  const filteredNetworkNonIngressHosts = useMemo<ExtendedNode[]>(
    () =>
      networkHosts.filter(
        (node) =>
          (node.name?.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
            node.address?.toLowerCase().includes(gatewaySearch.toLowerCase())) &&
          node.isingressgateway === false
      ),
    [gatewaySearch, networkHosts]
  );

  const selectedGatewayHost = useMemo<Host | null>(() => {
    if (!selectedNode) return null;
    return store.hosts.find((h) => h.id === selectedNode.hostid) || null;
  }, [selectedNode, store.hosts]);

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const gatewayTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => {
    return [
      {
        title: 'Host name',
        dataIndex: 'name',
        render(value) {
          return <Typography.Link>{value}</Typography.Link>;
        },
      },
      {
        title: 'Address',
        dataIndex: 'address',
      },
      {
        title: 'OS',
        dataIndex: 'os',
      },
      {
        title: 'Health status',
        render(value, node) {
          return getNodeConnectivity(node);
        },
      },
    ];
  }, [getNodeConnectivity]);

  const resetModal = () => {
    form.resetFields();
    setSelectedNode(null);
    setIsSelectOpen(false);
    setGatewaySearch('');
    setIsSubmitting(false);
  };

  const createIngress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      await NodesService.createIngressNode(formData.node.id, networkId, {
        failover: false,
        extclientdns: formData.extclientdns,
      });
      resetModal();
      notify.success({ message: `Client gateway created` });
      onCreateIngress();
    } catch (err) {
      notify.error({
        message: 'Failed to create client gateway',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedNode) {
      form.setFieldValue('node', undefined);
    }
  }, [form, selectedNode]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add Client Gateway</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />

      <Form name="add-ingress-form" form={form} layout="vertical">
        <div className="" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div className="CustomModalBody">
            <Form.Item label="Host" name="node" rules={[{ required: true }]} style={{ marginBottom: '0px' }}>
              <Select
                open={isSelectOpen}
                placeholder="Select a host as gateway"
                value={selectedNode?.name}
                onDropdownVisibleChange={(visible) => setIsSelectOpen(visible)}
                dropdownRender={() => (
                  <div style={{ padding: '.5rem' }}>
                    <Row style={{ marginBottom: '1rem' }}>
                      <Col span={8}>
                        <Input
                          placeholder="Search host"
                          value={gatewaySearch}
                          onChange={(e) => setGatewaySearch(e.target.value)}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Table
                          size="small"
                          columns={gatewayTableCols}
                          dataSource={filteredNetworkNonIngressHosts}
                          rowKey="id"
                          onRow={(node) => {
                            return {
                              onClick: () => {
                                setSelectedNode(node);
                                form.setFieldValue('node', { ...node, label: node.name });
                                setIsSelectOpen(false);
                              },
                            };
                          }}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              />
            </Form.Item>
            {!!selectedNode && (
              <>
                <Row
                  style={{
                    padding: '.5rem',
                    borderRadius: '8px',
                    marginTop: '1rem',
                  }}
                >
                  <Col span={24} style={{ marginBottom: '.5rem' }}>
                    <Typography.Text>
                      <small>Selected host details</small>
                    </Typography.Text>
                  </Col>
                  <Col span={6}>{selectedNode.name ?? ''}</Col>
                  <Col span={6}>
                    {selectedNode.address ?? ''}, {selectedNode.address6 ?? ''}
                  </Col>
                  <Col span={6}>{selectedNode.os ?? ''}</Col>
                  <Col span={5}>{getNodeConnectivity(selectedNode)}</Col>
                  <Col span={1} style={{ textAlign: 'right' }}>
                    <Button
                      danger
                      size="small"
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => {
                        form.setFieldValue('gatewayId', '');
                        setSelectedNode(null);
                      }}
                    />
                  </Col>
                </Row>
                {!!selectedGatewayHost && isHostNatted(selectedGatewayHost) && (
                  <Row style={{ padding: '.5rem', borderRadius: '8px' }}>
                    <Col span={24}>
                      <Alert
                        type="warning"
                        message="The selected host is behind a NAT gateway, which may affect reachability."
                        showIcon
                      />
                    </Col>
                  </Row>
                )}
              </>
            )}

            <Form.Item label="Default client DNS" name="extclientdns" style={{ marginTop: '1rem' }}>
              <Input placeholder="Default DNS for associated external clients" />
            </Form.Item>
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />

        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button type="primary" onClick={createIngress} loading={isSubmitting}>
                Create Gateway
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
