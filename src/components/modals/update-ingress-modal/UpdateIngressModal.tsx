import { Button, Col, Divider, Form, Input, Modal, notification, Row } from 'antd';
import { MouseEvent, useState } from 'react';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';

interface UpdateIngressModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  ingress: Node;
  onUpdateIngress: () => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface UpdateIngressForm {
  ingressdns: string;
}

export default function UpdateIngressModal({
  isOpen,
  onUpdateIngress,
  onCancel,
  ingress,
  networkId,
}: UpdateIngressModalProps) {
  const [form] = Form.useForm<UpdateIngressForm>();
  const [notify, notifyCtx] = notification.useNotification();

  const storeUpdateNode = useStore().updateNode;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    form.resetFields();
  };

  const updateIngress = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      const newNode = (
        await NodesService.updateNode(ingress.id, networkId, { ...ingress, ingressdns: formData.ingressdns })
      ).data;
      storeUpdateNode(ingress.id, newNode);
      notify.success({ message: `Ingress gateway updated` });
      onUpdateIngress();
    } catch (err) {
      notify.error({
        message: 'Failed to update ingress gateway',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Ingress</span>}
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
              label="Default External client DNS"
              data-nmui-intercom="update-ingress-form_ingressdns"
            >
              <Input placeholder="DNS" />
            </Form.Item>
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button type="primary" onClick={updateIngress} loading={isSubmitting}>
                Update Ingress
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
