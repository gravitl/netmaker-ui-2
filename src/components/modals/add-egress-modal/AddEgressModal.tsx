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
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { AxiosError } from 'axios';
import { NodesService } from '@/services/NodesService';
import { isValidIpCidr } from '@/utils/NetworkUtils';
import { CreateEgressNodeDto } from '@/services/dtos/CreateEgressNodeDto';

interface AddEgressModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateEgress: () => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type AddEgressFormFields = CreateEgressNodeDto & {
  nodeId: Node['id'];
  isInternetGateway: boolean;
};

const internetRangeIpv4 = '0.0.0.0/0';
const internetRangeIpv6 = '::/0';

export default function AddEgressModal({ isOpen, onCreateEgress, onCancel, networkId }: AddEgressModalProps) {
  const [form] = Form.useForm<AddEgressFormFields>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [egressSearch, setEgressSearch] = useState('');
  const [selectedEgress, setSelectedEgress] = useState<ExtendedNode | null>(null);
  const idFormField = 'nodeId';

  const natEnabledVal = Form.useWatch('natEnabled', form);
  const isInternetGatewayVal = Form.useWatch('isInternetGateway', form);
  const rangesVal = Form.useWatch('ranges', form);

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const network = useMemo<Network | undefined>(
    () => store.networks.find((net) => net.netid === networkId),
    [networkId, store.networks],
  );

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
        render(value, egress) {
          return <Typography.Text>{`${value}, ${egress.address6}`}</Typography.Text>;
        },
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
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
    setEgressSearch('');
    setSelectedEgress(null);
  };

  const createEgress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);

      if (!selectedEgress) return;
      await NodesService.createEgressNode(selectedEgress.id, networkId, {
        ...formData,
        natEnabled: formData.natEnabled ? 'yes' : 'no',
      });
      resetModal();
      onCreateEgress();
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

  useEffect(() => {
    if (isInternetGatewayVal) {
      form.setFieldsValue({
        ranges: [
          ...new Set(
            [...rangesVal, internetRangeIpv4],
            // .concat(network?.isipv6 ? [internetRangeIpv6] : [])
          ),
        ],
      });
    } else {
      form.setFieldsValue({
        ranges: rangesVal?.filter((range) => ![internetRangeIpv4, internetRangeIpv6].includes(range)),
      });
    }
  }, [form, isInternetGatewayVal, network?.isipv6, rangesVal]);

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
                      </Row>
                      <Row>
                        <Col span={24}>
                          <Table
                            size="small"
                            columns={egressTableCols}
                            dataSource={filteredNetworkHosts}
                            rowKey="id"
                            onRow={(node) => {
                              return {
                                onClick: () => {
                                  form.setFieldValue(idFormField, node.id);
                                  setSelectedEgress(node);
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
              {!!selectedEgress && (
                <>
                  <Row style={{ border: `1px solid ${themeToken.colorBorder}`, padding: '.5rem', borderRadius: '8px' }}>
                    <Col span={6}>{selectedEgress?.name ?? ''}</Col>
                    <Col span={6}>
                      {selectedEgress?.address ?? ''} {selectedEgress?.address6 ?? ''}
                    </Col>
                    <Col span={6}>{selectedEgress?.endpointip ?? ''}</Col>
                    <Col span={5}>{getNodeConnectivity(selectedEgress)}</Col>
                    <Col span={1} style={{ textAlign: 'right' }}>
                      <Button
                        danger
                        size="small"
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          form.setFieldValue(idFormField, '');
                          setSelectedEgress(null);
                        }}
                      />
                    </Col>
                  </Row>
                </>
              )}
            </Form.Item>
          </div>

          <Divider style={{ margin: '0px 0px 2rem 0px' }} />
          <div className="CustomModalBody">
            <Form.Item
              name="natEnabled"
              label="Enable NAT for egress traffic"
              valuePropName="checked"
              data-nmui-intercom="add-egress-form_natEnabled"
            >
              <Switch />
            </Form.Item>
            {!natEnabledVal && (
              <Alert
                type="warning"
                message="Egress may not function properly without NAT. You must ensure the host is properly configured"
              />
            )}

            <Typography.Title level={4}>Select external ranges</Typography.Title>

            <Form.Item
              name="isInternetGateway"
              label="Internet Gateway"
              valuePropName="checked"
              data-nmui-intercom="add-egress-form_isInternetGateway"
            >
              <Switch />
            </Form.Item>

            <Form.List
              name="ranges"
              initialValue={['']}
              rules={[
                {
                  validator: async (_, ranges) => {
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
                            validator(_, value) {
                              if (!isValidIpCidr(value)) {
                                return Promise.reject('Invalid CIDR');
                              } else {
                                return Promise.resolve();
                              }
                            },
                          },
                        ]}
                        noStyle
                      >
                        <Input
                          placeholder="CIDR range (eg: 10.0.0.0/8 or a123:4567::/16)"
                          style={{ width: '100%' }}
                          prefix={
                            <Tooltip title="Remove">
                              <CloseOutlined onClick={() => remove(index)} />
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
