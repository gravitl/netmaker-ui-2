import {
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
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, useState } from 'react';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { ExternalClient } from '@/models/ExternalClient';
import { validateExtClientNameField } from '@/utils/Utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';

interface UpdateClientModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  client: ExternalClient;
  onUpdateClient: (client: ExternalClient) => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function UpdateClientModal({
  isOpen,
  onUpdateClient,
  onCancel,
  networkId,
  client,
}: UpdateClientModalProps) {
  const [form] = Form.useForm<ExternalClient>();
  const [notify, notifyCtx] = notification.useNotification();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    form.resetFields();
  };

  const updateClient = async () => {
    try {
      const formData = await form.validateFields();
      formData.postup = formData.postup?.trim();
      formData.postdown = formData.postdown?.trim();
      setIsSubmitting(true);

      const newClient = (
        await NodesService.updateExternalClient(client.clientid, networkId, { ...client, ...formData })
      ).data;
      onUpdateClient(newClient);
      notify.success({ message: `External client updated` });
    } catch (err) {
      notify.error({
        message: 'Failed to update client',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientObj: ExternalClient = {
    ...client,
    extraallowedips: client.extraallowedips ?? [],
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Client Config</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      className="CustomModal UpdateClientModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="update-client-form" form={form} layout="vertical" initialValues={clientObj}>
        <div className="CustomModalBody">
          <Form.Item
            label="Client ID (Optional)"
            name="clientid"
            rules={validateExtClientNameField}
            data-nmui-intercom="update-client-form_clientid"
          >
            <Input placeholder="Unique name of client" />
          </Form.Item>

          <Collapse ghost size="small">
            <Collapse.Panel
              key="details"
              header={<Typography.Text style={{ marginTop: '0rem' }}>Advanced Settings</Typography.Text>}
            >
              <Form.Item
                label="Public Key (Optional)"
                name="publickey"
                data-nmui-intercom="update-client-form_publickey"
              >
                <Input placeholder="Public key" />
              </Form.Item>

              <Form.Item label="DNS (Optional)" name="dns" data-nmui-intercom="update-client-form_dns">
                <Input placeholder="Client DNS" />
              </Form.Item>

              <Form.Item
                label="Additional Addresses (Optional)"
                name="extraallowedips"
                data-nmui-intercom="update-client-form_extraallowedips"
              >
                <Select mode="tags" placeholder="Additional IP Addresses" clearIcon />
              </Form.Item>
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
                data-nmui-intercom="update-client-form_postup"
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
                data-nmui-intercom="update-client-form_postdown"
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
            </Collapse.Panel>
          </Collapse>
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={updateClient}
                loading={isSubmitting}
                data-nmui-intercom="update-client-form_submitbtn"
              >
                Update Client
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
