import { Button, Col, Divider, Form, Input, Modal, notification, Row, Switch, Tooltip, Typography } from 'antd';
import { MouseEvent, useState } from 'react';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { InfoCircleOutlined } from '@ant-design/icons';

interface UpdateRemoteAccessGatewayModalProp {
  isOpen: boolean;
  networkId: Network['netid'];
  ingress: Node;
  onUpdateIngress: () => any;
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
  const store = useStore();
  const isServerEE = store.serverConfig?.IsEE === 'yes';

  const storeUpdateNode = useStore().updateNode;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    form.resetFields();
  };

  const updateIngress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      let newNode = (
        await NodesService.updateNode(ingress.id, networkId, { ...ingress, ingressdns: formData.ingressdns })
      ).data;
      if (form.getFieldValue('isinternetgateway') !== ingress.isinternetgateway) {
        if (form.getFieldValue('isinternetgateway')) {
          newNode = (await NodesService.createInternetGateway(ingress.id, networkId, { inet_node_client_ids: [] }))
            .data;
        } else {
          newNode = (await NodesService.deleteInternetGateway(ingress.id, networkId)).data;
        }
      }
      storeUpdateNode(ingress.id, newNode);
      notify.success({ message: `Remote access gateway updated` });
      onUpdateIngress();
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
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Remote access Gateway</span>}
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
