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
  Switch,
  Table,
  TableColumnProps,
  theme,
  Typography,
} from 'antd';
import { MouseEvent, Ref, useCallback, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined, DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { AxiosError } from 'axios';
import { NodesService } from '@/services/NodesService';
import { CreateEgressNodeDto } from '@/services/dtos/CreateEgressNodeDto';
import './AddEgressModal.styles.scss';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';

interface AddEgressModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateEgress: (node: Node) => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  createEgressModalSelectHostRef: Ref<HTMLDivElement>;
  createEgressModalEnableNATRef: Ref<HTMLDivElement>;
  createEgressModalSelectExternalRangesRef: Ref<HTMLDivElement>;
}

type AddEgressFormFields = CreateEgressNodeDto & {
  nodeId: Node['id'];
};

export default function AddEgressModal({
  isOpen,
  onCreateEgress,
  onCancel,
  networkId,
  createEgressModalSelectHostRef,
  createEgressModalEnableNATRef,
}: AddEgressModalProps) {
  const [form] = Form.useForm<AddEgressFormFields>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [egressSearch, setEgressSearch] = useState('');
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [selectedEgress, setSelectedEgress] = useState<ExtendedNode | null>(null);
  const idFormField = 'nodeId';

  const natEnabledVal = Form.useWatch('natEnabled', form);

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
          node.name?.toLowerCase().includes(egressSearch.toLowerCase()) ||
          node.address?.toLowerCase().includes(egressSearch.toLowerCase()),
      ),
    [egressSearch, networkHosts],
  );

  const egressTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => {
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
        render(_, egress) {
          const addrs = ([] as Array<string>).concat(egress.address || [], egress.address6 || []).join(', ');
          return <Typography.Text title={addrs}>{`${addrs}`}</Typography.Text>;
        },
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
      },
      {
        title: 'Firewall',
        dataIndex: 'firewallinuse',
      },
      {
        title: 'Health status',
        render(_, node) {
          return getNodeConnectivity(node);
        },
      },
    ];
  }, [getNodeConnectivity]);

  const isNodeSelectable = (node: Node) => {
    return !node.isegressgateway;
  };

  const resetModal = () => {
    form.resetFields();
    setEgressSearch('');
    setSelectedEgress(null);
  };

  const createEgress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);

      if (!selectedEgress) return;
      const egressNode = (
        await NodesService.createEgressNode(selectedEgress.id, networkId, {
          ...formData,
          natEnabled: formData.natEnabled ? 'yes' : 'no',
        })
      ).data;
      resetModal();
      onCreateEgress(egressNode);
      notify.success({ message: `Egress gateway created` });
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to egress gateway',
          description: extractErrorMsg(err),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create an Egress</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      className="CustomModal AddEgressModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-egress-form" form={form} layout="vertical" initialValues={{ natEnabled: true }}>
        <div className="scrollable-modal-body">
          <div className="CustomModalBody">
            <Form.Item
              label="Select host"
              name={idFormField}
              rules={[{ required: true }]}
              style={{ marginBottom: '0px' }}
              data-nmui-intercom="add-egress-form_host"
            >
              {!selectedEgress && (
                <Row>
                  <Col span={24} ref={createEgressModalSelectHostRef}>
                    <Select
                      placeholder="Select a host as gateway"
                      dropdownRender={() => (
                        <div style={{ padding: '.5rem' }}>
                          <Row style={{ marginBottom: '1rem' }}>
                            <Col span={8}>
                              <Input
                                placeholder="Search host"
                                value={egressSearch}
                                onChange={(e) => setEgressSearch(e.target.value)}
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
                                  columns={egressTableCols}
                                  dataSource={filteredNetworkHosts.sort((a, b) =>
                                    isNodeSelectable(a) === isNodeSelectable(b) ? 0 : isNodeSelectable(a) ? -1 : 1,
                                  )}
                                  rowKey="id"
                                  onRow={(node) => {
                                    return {
                                      onClick: () => {
                                        if (!isNodeSelectable(node)) return;
                                        form.setFieldValue(idFormField, node.id);
                                        setSelectedEgress(node);
                                      },
                                      title: !isNodeSelectable(node) ? 'This host is already an egress gateway' : '',
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
                      open={isDropDownOpen}
                    />
                  </Col>
                </Row>
              )}
              {!!selectedEgress && (
                <>
                  <Row style={{ border: `1px solid ${themeToken.colorBorder}`, padding: '.5rem', borderRadius: '8px' }}>
                    <Col span={6}>{selectedEgress?.name ?? ''}</Col>
                    <Col span={6}>
                      {selectedEgress?.address ?? ''} {selectedEgress?.address6 ?? ''}
                    </Col>
                    <Col span={5}>{selectedEgress?.endpointip ?? ''}</Col>
                    <Col span={3}>{selectedEgress.firewallinuse}</Col>
                    <Col span={3}>{getNodeConnectivity(selectedEgress)}</Col>
                    <Col span={1} style={{ textAlign: 'right' }}>
                      <Button
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        type="primary"
                        onClick={() => {
                          form.setFieldValue(idFormField, '');
                          setSelectedEgress(null);
                        }}
                      />
                    </Col>
                  </Row>
                  {selectedEgress.firewallinuse === 'none' && (
                    <Row>
                      <Col xs={24}>
                        <Alert
                          type="warning"
                          message={
                            <>
                              <Typography.Text>
                                Netmaker requires nftables or iptables to be configured on the host for egress to
                                function.
                                <br />
                                Need help setting up? visit these links to install{' '}
                                <Typography.Link
                                  href={ExternalLinks.NFTABLES_DOCS_LINK}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  nftables
                                </Typography.Link>{' '}
                                or{' '}
                                <Typography.Link
                                  href={ExternalLinks.IPTABLES_DOCS_LINK}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  iptables
                                </Typography.Link>{' '}
                                on your linux host.
                              </Typography.Text>
                            </>
                          }
                          style={{ marginTop: '1rem', width: '100%' }}
                        />
                      </Col>
                    </Row>
                  )}
                </>
              )}
            </Form.Item>
          </div>

          <Divider style={{ margin: '0px 0px 2rem 0px' }} />
          <div className="CustomModalBody">
            <Row>
              <Col span={24} ref={createEgressModalEnableNATRef}>
                <Form.Item
                  name="natEnabled"
                  label="Enable NAT for egress traffic"
                  valuePropName="checked"
                  data-nmui-intercom="add-egress-form_natEnabled"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            {!natEnabledVal && (
              <Alert
                type="warning"
                message="Egress may not function properly without NAT. You must ensure the host is properly configured"
              />
            )}

            {/* <Row>
              <Col xs={24} ref={createEgressModalSelectExternalRangesRef}>
                <Typography.Title level={4}>Select external ranges</Typography.Title>

            <Form.List
              name="ranges"
              initialValue={['']}
              rules={[
                {
                  validator: async (_, ranges: Array<string>) => {
                    if (!ranges || ranges.length < 1) {
                      return Promise.reject(new Error('Enter at least one address range'));
                    }
                  },
                },
              ]}
              data-nmui-intercom="add-egress-form_ranges"
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      label={index === 0 ? 'Input range' : ''}
                      key={field.key}
                      required={false}
                      style={{ marginBottom: '.5rem' }}
                    >
                      <Form.Item
                        {...field}
                        validateTrigger={['onBlur']}
                        rules={[
                          {
                            required: true,
                            validator(_, value: string) {
                              if (!isValidIpCidr(value)) {
                                return Promise.reject('Invalid CIDR');
                              } else {
                                if (value.includes(INTERNET_RANGE_IPV4) || value.includes(INTERNET_RANGE_IPV6)) {
                                  return Promise.reject('Visit the Remote Access tab to create an internet gateway');
                                }
                                return Promise.resolve();
                              }
                            }
                          },
                        ]}
                      
                             noStyle
                          >
                            <Input
                              placeholder="CIDR range (eg: 10.0.0.0/8 or a123:4567::/16)"
                              style={{ width: '100%' }}
                              prefix={
                                <Tooltip title="Remove">
                                  <Button
                                    danger
                                    type="link"
                                    icon={<CloseOutlined />}
                                    onClick={() => remove(index)}
                                    size="small"
                                  />
                                </Tooltip>
                              }
                            />
                          </Form.Item>
                        </Form.Item>
                      ))}
                      <Form.Item>
                        <Button
                          onClick={() => add()}
                          icon={<PlusOutlined />}
                          data-nmui-intercom="add-egress-form_addrangebtn"
                        >
                          Add range
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Col>
            </Row> */}
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={createEgress}
                loading={isSubmitting}
                data-nmui-intercom="add-egress-form_submitbtn"
              >
                Create Egress
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
