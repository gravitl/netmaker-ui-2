import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select, Switch, Tooltip, Typography } from 'antd';
import { MouseEvent, useState } from 'react';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { InfoCircleOutlined } from '@ant-design/icons';
import { isValidIp } from '@/utils/NetworkUtils';
import { useServerLicense } from '@/utils/Utils';

interface UpdateRemoteAccessGatewayModalProp {
  isOpen: boolean;
  networkId: Network['netid'];
  ingress: Node;
  onUpdateIngress: (node: Node) => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface UpdateRemoteAccessGatewayForm {
  ingressdns: string;
}

export default function UpdateRemoteAccessGatewayModal({
  isOpen,
  onUpdateIngress,
  onCancel,
  ingress,
  networkId,
}: UpdateRemoteAccessGatewayModalProp) {
  const [form] = Form.useForm<UpdateRemoteAccessGatewayForm>();
  const [notify, notifyCtx] = notification.useNotification();
  const { isServerEE } = useServerLicense();

  const storeUpdateNode = useStore().updateNode;
  const storeFetchNodes = useStore().fetchNodes;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    form.resetFields();
  };

  const updateIngress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      const newNode = (
        await NodesService.updateNode(ingress.id, networkId, {
          ...ingress,
          ingressdns: formData.ingressdns,
          isinternetgateway: form.getFieldValue('isinternetgateway'),
          additional_rag_ips: form.getFieldValue('additional_rag_ips'),
          metadata: form.getFieldValue('metadata'),
        })
      ).data;
      storeUpdateNode(ingress.id, newNode);
      storeFetchNodes();
      notify.success({ message: `Remote access gateway updated` });
      onUpdateIngress(newNode);
    } catch (err) {
      notify.error({
        message: 'Failed to update remote access gateway',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Remote Access Gateway</span>}
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
      <Form name="update-ingress-form" form={form} layout="vertical" initialValues={ingress}>
        <div className="" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div className="CustomModalBody">
            <Form.Item
              name="ingressdns"
              label="Default Client config DNS"
              data-nmui-intercom="update-ingress-form_ingressdns"
            >
              <Input placeholder="DNS" />
            </Form.Item>

            {isServerEE && (
              <Form.Item
                name="additional_rag_ips"
                label="Additional Endpoints"
                data-nmui-intercom="update-ingress-form_additional-endpoints"
                rules={[
                  {
                    type: 'array',
                    validator: (_: any, ips: string[]) => {
                      if (ips.every((ip) => isValidIp(ip))) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Addresses must be valid IPs');
                    },
                  },
                ]}
              >
                <Select
                  placeholder="Additional endpoints clients can use to connect to this gateway"
                  mode="tags"
                  options={ingress.additional_rag_ips?.map((ip) => ({ label: ip, value: ip })) ?? []}
                />
              </Form.Item>
            )}

            <Form.Item
              label="Network Info"
              name="metadata"
              style={{ marginTop: '1rem' }}
              data-nmui-intercom="add-ingress-form_metadata"
            >
              <Input.TextArea placeholder="Enter information that users can view about the network, such as the purpose, internal domains and IP's of significance, etc" />
            </Form.Item>

            {!isServerEE && (
              <Form.Item
                name="isinternetgateway"
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
                data-nmui-intercom="update-ingress-form_isInternetGateway"
              >
                <Switch />
              </Form.Item>
            )}
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button type="primary" onClick={updateIngress} loading={isSubmitting}>
                Update Gateway
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
