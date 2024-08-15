import {
  Alert,
  AutoComplete,
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
  Switch,
  Table,
  TableColumnProps,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { CreateExternalClientReqDto } from '@/services/dtos/CreateExternalClientReqDto';
import { getExtendedNode, getNodeConnectivityStatus, isHostNatted } from '@/utils/NodeUtils';
import { CloseOutlined, DownOutlined, InfoCircleOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { Host } from '@/models/Host';
import { PUBLIC_DNS_RESOLVERS } from '@/constants/AppConstants';
import { useServerLicense, validateExtClientNameField } from '@/utils/Utils';
import _ from 'lodash';

interface AddClientModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  preferredGateway?: Node;
  onCreateClient: () => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  createClientConfigModalSelectGatewayRef?: Ref<HTMLDivElement>;
  createClientConfigModalClientIDRef?: Ref<HTMLDivElement>;
  createClientConfigModalPublicKeyRef?: Ref<HTMLDivElement>;
  createClientConfigModalDNSRef?: Ref<HTMLDivElement>;
  createClientConfigModalAdditionalAddressesRef?: Ref<HTMLDivElement>;
  createClientConfigModalPostUpRef: Ref<HTMLDivElement>;
  createClientConfigModalPostDownRef: Ref<HTMLDivElement>;
  isTourOpen?: boolean;
}

type AddClientFormFields = CreateExternalClientReqDto & {
  gatewayId: Node['id'];
  extclientdns: string;
  is_internet_gw: boolean;
  postup: string;
  postdown: string;
};

export default function AddClientModal({
  isOpen,
  onCreateClient,
  onCancel,
  networkId,
  preferredGateway,
  createClientConfigModalAdditionalAddressesRef,
  createClientConfigModalClientIDRef,
  createClientConfigModalDNSRef,
  createClientConfigModalPublicKeyRef,
  createClientConfigModalSelectGatewayRef,
  createClientConfigModalPostUpRef,
  createClientConfigModalPostDownRef,
  isTourOpen,
}: AddClientModalProps) {
  const [form] = Form.useForm<AddClientFormFields>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const { isServerEE } = useServerLicense();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<ExtendedNode | null>(null);
  const [isAutoselectionComplete, setIsAutoselectionComplete] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const isInternetGatewayVal = Form.useWatch('is_internet_gw', form);

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const networkHosts = useMemo<ExtendedNode[]>(() => {
    return store.nodes
      .filter((node) => node.network === networkId && node.isingressgateway)
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

  const initialPreferredGatewayHealth = useMemo(() => {
    if (!preferredGateway) return null;
    return getNodeConnectivity(preferredGateway);
  }, [preferredGateway, getNodeConnectivity]);

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
        title: 'Health status',
        render(_, node) {
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
      formData.postup = formData.postup?.trim();
      formData.postdown = formData.postdown?.trim();
      setIsSubmitting(true);

      if (!selectedGateway) return;

      if (!selectedGateway.isingressgateway) {
        await NodesService.createIngressNode(selectedGateway.id, networkId, {
          extclientdns: formData.extclientdns,
          is_internet_gw: isServerEE ? formData.is_internet_gw : false,
          metadata: '',
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
    // auto-select gateway
    if (isAutoselectionComplete) return;
    if (preferredGateway) {
      setSelectedGateway(getExtendedNode(preferredGateway, store.hostsCommonDetails));
      form.setFieldValue('gatewayId', preferredGateway.id);
      setIsAutoselectionComplete(true);
      return;
    }
  }, [form, isOpen, networkHosts, preferredGateway, store.hostsCommonDetails, isAutoselectionComplete]);

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Client Config</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      className="CustomModal"
      style={{ minWidth: '50vw' }}
      afterClose={() => {
        resetModal();
        setIsAutoselectionComplete(false);
      }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-client-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} ref={createClientConfigModalSelectGatewayRef}>
              <Form.Item
                label="Remote Access Gateway"
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
                          <Col span={16} style={{ textAlign: 'right' }}>
                            <Button
                              type="primary"
                              onClick={() => {
                                setIsDropDownOpen(false);
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
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                    onDropdownVisibleChange={(open) => setIsDropDownOpen(open)}
                    suffixIcon={isDropDownOpen ? <UpOutlined /> : <DownOutlined />}
                    open={isDropDownOpen}
                  />
                )}
                {!!selectedGateway && (
                  <>
                    <Row
                      style={{ border: `1px solid ${themeToken.colorBorder}`, padding: '.5rem', borderRadius: '8px' }}
                    >
                      <Col span={6}>{selectedGateway?.name ?? ''}</Col>
                      <Col span={6}>
                        {([] as Array<string>)
                          .concat(selectedGateway.address || [], selectedGateway.address6 || [])
                          .join(', ')}
                      </Col>
                      <Col span={6}>
                        {selectedGateway.isingressgateway && <Badge status="success" text="Gateway" />}
                        {!selectedGateway.isingressgateway && <Badge status="error" text="Not a Gateway" />}
                      </Col>
                      <Col span={5}>
                        {_.isEqual(selectedGateway, preferredGateway)
                          ? initialPreferredGatewayHealth
                          : getNodeConnectivity(selectedGateway)}
                      </Col>
                      <Col span={1} style={{ textAlign: 'right' }}>
                        <Button
                          danger
                          size="small"
                          icon={<CloseOutlined />}
                          type="primary"
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
            </Col>
          </Row>
          {selectedGateway && !selectedGateway.isingressgateway && (
            <>
              <Form.Item
                name="extclientdns"
                label="Default Client DNS"
                data-nmui-intercom="add-client-form_extclientdns"
                rules={[{ required: isInternetGatewayVal, message: 'This field is required for internet gateways' }]}
              >
                <AutoComplete
                  options={PUBLIC_DNS_RESOLVERS}
                  style={{ width: '100%' }}
                  placeholder="Default DNS for associated clients"
                  allowClear
                />
              </Form.Item>
              {isServerEE && (
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
              )}
            </>
          )}
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} ref={createClientConfigModalClientIDRef}>
              <Form.Item
                label="Client ID (Optional)"
                name="clientid"
                rules={validateExtClientNameField}
                data-nmui-intercom="add-client-form_clientid"
              >
                <Input placeholder="Unique name of client" />
              </Form.Item>
            </Col>
          </Row>

          <Collapse ghost size="small" defaultActiveKey={isTourOpen ? 'details' : ''}>
            <Collapse.Panel
              key="details"
              header={<Typography.Text style={{ marginTop: '0rem' }}>Advanced Settings</Typography.Text>}
            >
              <Row>
                <Col xs={24} ref={createClientConfigModalPublicKeyRef}>
                  <Form.Item
                    label="Public Key (Optional)"
                    name="publickey"
                    data-nmui-intercom="add-client-form_publickey"
                  >
                    <Input placeholder="Public key" />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col xs={24} ref={createClientConfigModalDNSRef}>
                  <Form.Item label="DNS (Optional)" name="dns" data-nmui-intercom="add-client-form_dns">
                    <Input placeholder="Client DNS" />
                  </Form.Item>
                </Col>
              </Row>

              <Row>
                <Col xs={24} ref={createClientConfigModalAdditionalAddressesRef}>
                  <Form.Item
                    label="Additional Addresses (Optional)"
                    name="extraallowedips"
                    data-nmui-intercom="add-client-form_extraallowedips"
                  >
                    <Select mode="tags" placeholder="Additional IP Addresses" allowClear={true} />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col xs={24} ref={createClientConfigModalPostUpRef}>
                  <Form.Item
                    label={
                      <>
                        Post Up (Optional)
                        <Tooltip title="PostUp serves as a lifetime hook that runs the provided script that run just after wireguard sets up the interface and the VPN connection is live">
                          <InfoCircleOutlined style={{ marginLeft: '0.3em' }} />
                        </Tooltip>
                      </>
                    }
                    name="postup"
                    data-nmui-intercom="add-client-form_postup"
                    rules={[
                      {
                        required: false,
                      },
                      {
                        max: 1024,
                        message: 'PostUp script cannot exceed 1024 characters',
                      },
                    ]}
                  >
                    <Input placeholder="PostUp script" />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col xs={24} ref={createClientConfigModalPostDownRef}>
                  <Form.Item
                    label={
                      <>
                        Post Down (Optional)
                        <Tooltip title="PostDown serves as a lifetime hook that runs the provided script that run just after wireguard tears down the interface">
                          <InfoCircleOutlined style={{ marginLeft: '0.3em' }} />
                        </Tooltip>
                      </>
                    }
                    name="postdown"
                    data-nmui-intercom="add-client-form_postdown"
                    rules={[
                      {
                        required: false,
                      },
                      {
                        max: 1024,
                        message: 'PostDown script cannot exceed 1024 characters',
                      },
                    ]}
                  >
                    <Input placeholder="PostDown script" />
                  </Form.Item>
                </Col>
              </Row>
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
