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
  theme,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { CreateExternalClientReqDto } from '@/services/dtos/CreateExternalClientReqDto';
import { HostCommonDetails } from '@/models/Host';
import { getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { AxiosError } from 'axios';
import { NodesService } from '@/services/NodesService';

interface AddClientModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateClient: () => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type AddClientFormFields = CreateExternalClientReqDto & {
  gatewayId: Node['id'];
};

export default function AddClientModal({ isOpen, onCreateClient, onCancel, networkId }: AddClientModalProps) {
  const [form] = Form.useForm<AddClientFormFields>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<(Node & HostCommonDetails) | null>(null);
  const [isFailoverGateway, setIsFailoverGateway] = useState(false);

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const networkHosts = useMemo<(Node & HostCommonDetails)[]>(() => {
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => ({ ...node, ...store.hostsCommonDetails[node.hostid] }));
  }, [networkId, store.hostsCommonDetails, store.nodes]);
  const filteredNetworkHosts = useMemo<(Node & HostCommonDetails)[]>(
    () =>
      networkHosts.filter(
        (node) =>
          node.name?.toLowerCase().includes(gatewaySearch.toLowerCase()) ||
          node.address?.toLowerCase().includes(gatewaySearch.toLowerCase())
      ),
    [gatewaySearch, networkHosts]
  );
  const gatewayTableCols = useMemo<TableColumnProps<Node & HostCommonDetails>[]>(() => {
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

  const createClient = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);

      if (!selectedGateway) return;

      if (!selectedGateway.isingressgateway) {
        await NodesService.createIngressNode(selectedGateway.id, networkId, { failover: isFailoverGateway });
      }

      await NodesService.createExternalClient(selectedGateway.id, networkId, formData);
      onCreateClient();
      notify.success({ message: `External client created` });
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to create client',
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
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Client</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      // centered
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
            style={{ marginBottom: '0px' }}
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
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Table
                          size="small"
                          columns={gatewayTableCols}
                          dataSource={filteredNetworkHosts}
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
              </>
            )}
          </Form.Item>
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Form.Item label="Client ID" name="clientid">
            <Input placeholder="Unique name of client" />
          </Form.Item>

          <Form.Item label="Public Key" name="publickey">
            <Input placeholder="Public key" />
          </Form.Item>

          <Form.Item label="Addresses" name="address">
            <Select mode="tags" placeholder="IP Addresses" clearIcon disabled />
          </Form.Item>
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
