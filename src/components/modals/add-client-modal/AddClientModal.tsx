import {
  Alert,
  Badge,
  Button,
  Col,
  Collapse,
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
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { CreateExternalClientReqDto } from '@/services/dtos/CreateExternalClientReqDto';
import { getExtendedNode, getNodeConnectivityStatus, isHostNatted } from '@/utils/NodeUtils';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { Host } from '@/models/Host';

interface AddClientModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  preferredGateway?: Node;
  onCreateClient: () => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type AddClientFormFields = CreateExternalClientReqDto & {
  gatewayId: Node['id'];
  extclientdns: string;
};

export default function AddClientModal({
  isOpen,
  onCreateClient,
  onCancel,
  networkId,
  preferredGateway,
}: AddClientModalProps) {
  const [form] = Form.useForm<AddClientFormFields>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<ExtendedNode | null>(null);
  const [isFailoverGateway, setIsFailoverGateway] = useState(false);
  const [isAutoselectionComplete, setIsAutoselectionComplete] = useState(false);

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const networkHosts = useMemo<ExtendedNode[]>(() => {
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => ({ ...node, ...getExtendedNode(node, store.hostsCommonDetails) }));
  }, [networkId, store.hostsCommonDetails, store.nodes]);

  const filteredNetworkHosts = useMemo<ExtendedNode[]>(
    () =>
      networkHosts.filter(
        (node) =>
          node.name?.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
          node.address?.toLowerCase().includes(gatewaySearch.toLowerCase()),
      ),
    [gatewaySearch, networkHosts],
  );

  const selectedGatewayHost = useMemo<Host | null>(() => {
    if (!selectedGateway) return null;
    return store.hosts.find((h) => h.id === selectedGateway.hostid) || null;
  }, [selectedGateway, store.hosts]);

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
        title: 'Client Gateway',
        // dataIndex: 'name',
        render(value, node) {
          if (node.isingressgateway) return <Badge status="success" text="Gateway" />;
          return <Badge status="error" text="Gateway" />;
        },
      },
      {
        title: 'Health status',
        // dataIndex: 'lastcheckin',
        render(value, node) {
          return getNodeConnectivity(node);
        },
      },
    ];
  }, [getNodeConnectivity]);

  const resetModal = () => {
    form.resetFields();
    setSelectedGateway(null);
    setGatewaySearch('');
  };

  const createClient = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);

      if (!selectedGateway) return;

      if (!selectedGateway.isingressgateway) {
        await NodesService.createIngressNode(selectedGateway.id, networkId, {
          failover: isFailoverGateway,
          extclientdns: formData.extclientdns,
        });
      }

      await NodesService.createExternalClient(selectedGateway.id, networkId, formData);
      onCreateClient();
      notify.success({ message: `External client created` });
      resetModal();
    } catch (err) {
      notify.error({
        message: 'Failed to create client',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // auto-select client gateway
    if (isAutoselectionComplete) return;
    if (preferredGateway) {
      setSelectedGateway(getExtendedNode(preferredGateway, store.hostsCommonDetails));
      form.setFieldValue('gatewayId', preferredGateway.id);
      return;
    }
    const gateways = networkHosts.filter((node) => node.isingressgateway);
    if (gateways.length) {
      setSelectedGateway(gateways[0]);
      form.setFieldValue('gatewayId', gateways[0].id);
    }
    setIsAutoselectionComplete(true);
  }, [form, isOpen, networkHosts, preferredGateway, store.hostsCommonDetails, isAutoselectionComplete]);

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Client</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      className="CustomModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-client-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <Form.Item
            label="Client Gateway"
            name="gatewayId"
            rules={[{ required: true }]}
            data-nmui-intercom="add-client-form_gatewayId"
          >
            {!selectedGateway && (
              <Select
                placeholder="Select a host as gateway"
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
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Table
                          size="small"
                          columns={gatewayTableCols}
                          dataSource={filteredNetworkHosts}
                          rowKey="id"
                          onRow={(node) => {
                            return {
                              onClick: () => {
                                form.setFieldValue('gatewayId', node.id);
                                setSelectedGateway(node);
                              },
                            };
                          }}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              />
            )}
            {!!selectedGateway && (
              <>
                <Row style={{ border: `1px solid ${themeToken.colorBorder}`, padding: '.5rem', borderRadius: '8px' }}>
                  <Col span={6}>{selectedGateway?.name ?? ''}</Col>
                  <Col span={6}>{selectedGateway?.address ?? ''}</Col>
                  <Col span={6}>
                    {selectedGateway.isingressgateway && <Badge status="success" text="Gateway" />}
                    {!selectedGateway.isingressgateway && <Badge status="error" text="Not a Gateway" />}
                  </Col>
                  <Col span={5}>{getNodeConnectivity(selectedGateway)}</Col>
                  <Col span={1} style={{ textAlign: 'right' }}>
                    <Button
                      danger
                      size="small"
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => {
                        form.setFieldValue('gatewayId', '');
                        setSelectedGateway(null);
                      }}
                    />
                  </Col>
                </Row>
                {!selectedGateway.isingressgateway && (
                  <Row style={{ padding: '.5rem', borderRadius: '8px' }}>
                    <Col span={24}>
                      <Alert type="info" message="Proceeding will turn this host into a gateway." showIcon />
                    </Col>
                  </Row>
                )}
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
          </Form.Item>

          {selectedGateway && !selectedGateway.isingressgateway && (
            <Form.Item name="extclientdns" label="Default Client DNS" data-nmui-intercom="add-client-form_extclientdns">
              <Input placeholder="Default DNS for associated clients" />
            </Form.Item>
          )}
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Form.Item
            label="Client ID (Optional)"
            name="clientid"
            rules={[{ min: 5, max: 32 }]}
            data-nmui-intercom="add-client-form_clientid"
          >
            <Input placeholder="Unique name of client" />
          </Form.Item>

          <Collapse ghost size="small">
            <Collapse.Panel
              key="details"
              header={<Typography.Text style={{ marginTop: '0rem' }}>Advanced Settings</Typography.Text>}
            >
              <Form.Item label="Public Key (Optional)" name="publickey" data-nmui-intercom="add-client-form_publickey">
                <Input placeholder="Public key" />
              </Form.Item>

              <Form.Item label="DNS (Optional)" name="dns" data-nmui-intercom="add-client-form_dns">
                <Input placeholder="Client DNS" />
              </Form.Item>

              <Form.Item
                label="Additional Addresses (Optional)"
                name="extraallowedips"
                data-nmui-intercom="add-client-form_extraallowedips"
              >
                <Select mode="tags" placeholder="Additional IP Addresses" clearIcon />
              </Form.Item>
            </Collapse.Panel>
          </Collapse>
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button type="primary" onClick={createClient} loading={isSubmitting}>
                Create Client
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
