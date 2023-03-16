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
  Switch,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { AxiosError } from 'axios';
import { NodesService } from '@/services/NodesService';
import { isValidIp } from '@/utils/NetworkUtils';
import { CreateEgressNodeDto } from '@/services/dtos/CreateEgressNodeDto';

interface UpdateEgressModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  egress: Node;
  onUpdateEgress: () => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type UpdateEgressFormFields = CreateEgressNodeDto & {
  ranges: Node['egressgatewayranges'];
};

export default function UpdateEgressModal({
  isOpen,
  onUpdateEgress,
  onCancel,
  egress,
  networkId,
}: UpdateEgressModalProps) {
  const [form] = Form.useForm<UpdateEgressFormFields>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const ranges = Form.useWatch('ranges', form);

  const extendedEgress = useMemo(
    () => getExtendedNode(egress, store.hostsCommonDetails),
    [egress, store.hostsCommonDetails]
  );

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const updateEgress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      const newRanges = new Set(formData.ranges);
      await NodesService.deleteEgressNode(egress.id, networkId);
      if (newRanges.size > 0) {
        await NodesService.createEgressNode(egress.id, networkId, {
          ranges: [...newRanges],
          natEnabled: formData.natEnabled ? 'yes' : 'no',
        });
      }
      onUpdateEgress();
      notify.success({ message: `Egress gateway updated` });
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to update egress gateway',
          description: extractErrorMsg(err),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadHosts = useCallback(async () => {
    try {
      await store.fetchHosts();
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to load hosts',
          description: extractErrorMsg(err),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify]);

  useEffect(() => {
    // TODO: move to upper component
    loadHosts();
  }, [loadHosts]);

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Egress</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      className="CustomModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form
        name="add-egress-form"
        form={form}
        layout="vertical"
        initialValues={{ ...egress, natEnabled: egress.egressgatewaynatenabled }}
      >
        <div className="" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div className="CustomModalBody">
            <Form.Item label="Host" rules={[{ required: true }]} style={{ marginBottom: '0px' }}>
              {!!extendedEgress && (
                <>
                  <Row style={{ border: `1px solid ${themeToken.colorBorder}`, padding: '.5rem', borderRadius: '8px' }}>
                    <Col span={6}>{extendedEgress?.name ?? ''}</Col>
                    <Col span={6}>
                      {extendedEgress?.address ?? ''} {extendedEgress?.address6 ?? ''}
                    </Col>
                    <Col span={6}>{extendedEgress?.endpointip ?? ''}</Col>
                    <Col span={5}>{getNodeConnectivity(extendedEgress)}</Col>
                  </Row>
                </>
              )}
            </Form.Item>
          </div>

          <Divider style={{ margin: '0px 0px 2rem 0px' }} />
          <div className="CustomModalBody">
            <Form.Item name="natEnabled" label="Enable NAT for egress traffic">
              <Switch defaultChecked={egress.egressgatewaynatenabled} />
            </Form.Item>

            <Typography.Title level={4}>Select external ranges</Typography.Title>

            <Form.List name="ranges" initialValue={egress.egressgatewayranges}>
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
                              if (!isValidIp(value)) {
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
                          suffix={
                            <Tooltip title="Remove">
                              <CloseOutlined onClick={() => remove(index)} />
                            </Tooltip>
                          }
                        />
                      </Form.Item>
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button onClick={() => add()} icon={<PlusOutlined />}>
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
              <Button type="primary" danger={ranges?.length === 0} onClick={updateEgress} loading={isSubmitting}>
                {ranges?.length === 0 ? 'Delete Egress' : 'Update Egress'}
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
