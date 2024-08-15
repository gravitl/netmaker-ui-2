import {
  Alert,
  AutoComplete,
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
  Switch,
  Table,
  TableColumnProps,
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus, isHostNatted } from '@/utils/NodeUtils';
import { CloseOutlined, DownOutlined, InfoCircleOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { Host } from '@/models/Host';
import { CreateIngressNodeDto } from '@/services/dtos/CreateIngressNodeDto';
import { PUBLIC_DNS_RESOLVERS } from '@/constants/AppConstants';
import { coerce } from 'semver';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { useServerLicense } from '@/utils/Utils';

interface AddRemoteAccessGatewayModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateIngress: (node: Node) => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  addClientGatewayModalHostRef?: Ref<HTMLDivElement>;
  addClientGatewayModalDefaultClientDNSRef?: Ref<HTMLDivElement>;
  addClientGatewayModalIsInternetGatewayRef?: Ref<HTMLDivElement>;
}

interface AddRemoteAccessGatewaysForm extends CreateIngressNodeDto {
  node: Node;
}

export default function AddRemoteAccessGatewayModal({
  isOpen,
  onCreateIngress,
  onCancel,
  networkId,
  addClientGatewayModalDefaultClientDNSRef,
  addClientGatewayModalHostRef,
  addClientGatewayModalIsInternetGatewayRef,
}: AddRemoteAccessGatewayModalProps) {
  const [form] = Form.useForm<AddRemoteAccessGatewaysForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const { isServerEE } = useServerLicense();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ExtendedNode | null>(null);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const isInternetGatewayVal = Form.useWatch('is_internet_gw', form);
  const defaultClientDNS = Form.useWatch('extclientdns', form);

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
          node.isingressgateway === false,
      ),
    [gatewaySearch, networkHosts],
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
        render(_, gateway) {
          const addrs = ([] as Array<string>).concat(gateway.address || [], gateway.address6 || []).join(', ');
          return <Typography.Text>{addrs}</Typography.Text>;
        },
      },
      {
        title: 'OS',
        dataIndex: 'os',
      },
      {
        title: 'Health status',
        render(_, node) {
          return getNodeConnectivity(node);
        },
      },
    ];
  }, [getNodeConnectivity]);

  const DNS_RESOLVERS = useMemo(() => {
    if (!store.serverConfig?.CoreDNSAddr || store.serverConfig?.CoreDNSAddr === '') {
      return PUBLIC_DNS_RESOLVERS;
    }
    return [
      ...PUBLIC_DNS_RESOLVERS,
      { label: `Core DNS (${store.serverConfig.CoreDNSAddr})`, value: store.serverConfig.CoreDNSAddr },
    ];
  }, [store.serverConfig?.CoreDNSAddr]);

  const coreDNSSetupInstructions = useMemo(() => {
    if (!store.serverConfig?.CoreDNSAddr || store.serverConfig?.CoreDNSAddr === '') return null;
    if (store.serverConfig?.CoreDNSAddr === defaultClientDNS) {
      return (
        <Alert
          type="info"
          message="In order to use CoreDNS as the default client DNS, you need to ensure CoreDNS is set up correctly. Click the button to view the setup instructions."
          showIcon
          action={
            <Button href={ExternalLinks.CORE_DNS_SETUP_LINK} target="_blank" type="primary">
              Go to Docs{' '}
            </Button>
          }
        />
      );
    }
  }, [defaultClientDNS, store.serverConfig?.CoreDNSAddr]);

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
      const ingressNode = (
        await NodesService.createIngressNode(formData.node.id, networkId, {
          extclientdns: formData.extclientdns,
          is_internet_gw: formData.is_internet_gw,
          metadata: formData.metadata,
        })
      ).data;
      resetModal();
      notify.success({ message: `Remote access gateway created` });
      onCreateIngress(ingressNode);
    } catch (err) {
      notify.error({
        message: 'Failed to create remote access gateway',
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
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add Remote Access Gateway</span>}
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
            <Row>
              <Col xs={24} ref={addClientGatewayModalHostRef}>
                <Form.Item
                  label="Host"
                  name="node"
                  rules={[{ required: true }]}
                  style={{ marginBottom: '0px' }}
                  data-nmui-intercom="add-ingress-form_node"
                >
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
                              prefix={<SearchOutlined />}
                            />
                          </Col>
                          <Col span={16} style={{ textAlign: 'right' }}>
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
                                rowSelection={{
                                  type: 'checkbox',
                                  hideSelectAll: true,
                                  selectedRowKeys: selectedNode ? [selectedNode.id] : [],
                                  onSelect: (record) => {
                                    if (selectedNode?.id === record.id) {
                                      setSelectedNode(null);
                                      form.setFieldValue('node', undefined);
                                    } else {
                                      setSelectedNode(record);
                                      form.setFieldValue('node', { ...record, label: record.name });
                                      setIsSelectOpen(false);
                                    }
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
                </Form.Item>
              </Col>
            </Row>
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
                    {([] as Array<string>).concat(selectedNode.address || [], selectedNode.address6 || []).join(', ')}
                  </Col>
                  <Col span={6}>{selectedNode.os ?? ''}</Col>
                  <Col span={5}>{getNodeConnectivity(selectedNode)}</Col>
                  <Col span={1} style={{ textAlign: 'right' }}>
                    <Button
                      danger
                      size="small"
                      type="primary"
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

            <Row>
              <Col xs={24} ref={addClientGatewayModalDefaultClientDNSRef}>
                <Form.Item
                  label="Default client DNS"
                  name="extclientdns"
                  style={{ marginTop: '1rem' }}
                  data-nmui-intercom="add-ingress-form_extclientdns"
                  rules={[{ required: isInternetGatewayVal, message: 'This field is required for internet gateways' }]}
                >
                  <AutoComplete
                    options={DNS_RESOLVERS}
                    style={{ width: '100%' }}
                    placeholder="Default DNS for associated clients"
                    allowClear
                  />
                </Form.Item>
                {coreDNSSetupInstructions}
              </Col>
            </Row>

            {!isServerEE && (
              <Row>
                <Col xs={24} ref={addClientGatewayModalIsInternetGatewayRef}>
                  <Form.Item
                    name="is_internet_gw"
                    label={
                      <Typography.Text>
                        Internet Gateway
                        <Tooltip
                          title="Internet gateways behave like traditional VPN servers: all traffic of connected clients would be routed through this host."
                          placement="right"
                        >
                          <InfoCircleOutlined style={{ marginLeft: '0.5rem' }} />
                        </Tooltip>
                      </Typography.Text>
                    }
                    valuePropName="checked"
                    data-nmui-intercom="add-ingress-form_isInternetGateway"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Row>
              <Col
                xs={24}
                // ref={addClientGatewayModalMetadataRef}
              >
                <Form.Item
                  label="Network Info"
                  name="metadata"
                  style={{ marginTop: '1rem' }}
                  data-nmui-intercom="add-ingress-form_metadata"
                >
                  <Input.TextArea placeholder="Enter information that users can view about the network, such as the purpose, internal domains and IP's of significance, etc" />
                </Form.Item>
              </Col>
            </Row>
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
