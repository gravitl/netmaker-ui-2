import { Button, Col, Divider, Form, Input, InputNumber, Modal, notification, Row, Switch, Typography } from 'antd';
import { MouseEvent } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Host } from '@/models/Host';
import { HostsService } from '@/services/HostsService';

interface UpdateHostModalProps {
  isOpen: boolean;
  host: Host;
  onUpdateHost: (host: Host) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function UpdateHostModal({ isOpen, host, onUpdateHost, onCancel }: UpdateHostModalProps) {
  const [form] = Form.useForm<Host>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const storeUpdateHost = store.updateHost;
  const isStaticVal: Host['isstatic'] = Form.useWatch('isstatic', form);

  const resetModal = () => {
    form.resetFields();
  };

  const updateHost = async () => {
    try {
      const formData = await form.validateFields();
      const newHost = (await HostsService.updateHost(host.id, { ...host, ...formData })).data;
      notify.success({ message: `Host ${host.id} updated` });
      storeUpdateHost(newHost.id, newHost);
      onUpdateHost(newHost);
    } catch (err) {
      notify.error({
        message: 'Failed to update host',
        description: extractErrorMsg(err as any),
      });
    }
  };

  return (
    <Modal
      title={
        <Typography.Title style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Update host (ID: {host.id})
        </Typography.Title>
      }
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="update-host-form" form={form} layout="vertical" initialValues={host}>
        <div className="scrollable-modal-body">
          <div className="CustomModalBody">
            <Form.Item
              label="Host name"
              name="name"
              rules={[{ required: true }]}
              data-nmui-intercom="update-host-form_name"
            >
              <Input placeholder="Host name" />
            </Form.Item>

            <Form.Item
              label="Maximum Transmission Unit (MTU)"
              name="mtu"
              rules={[{ required: true }]}
              data-nmui-intercom="update-host-form_mtu"
            >
              <InputNumber placeholder="MTU" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Persistent Keepalive"
              name="persistentkeepalive"
              data-nmui-intercom="update-host-form_persistentkeepalive"
            >
              <InputNumber placeholder="Persistent keepalive" min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Listen Port"
              name="listenport"
              rules={[{ required: true }]}
              data-nmui-intercom="update-host-form_listenport"
            >
              <InputNumber placeholder="Listen Port" min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Verbosity"
              name="verbosity"
              rules={[{ required: true }]}
              data-nmui-intercom="update-host-form_verbosity"
            >
              <InputNumber placeholder="Verbosity" min={0} max={4} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Static Endpoint"
              name="isstatic"
              valuePropName="checked"
              rules={[{ required: true }]}
              data-nmui-intercom="update-host-form_isstatic"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Endpoint IP"
              name="endpointip"
              rules={[{ required: isStaticVal }]}
              data-nmui-intercom="update-host-form_endpointip"
            >
              <Input placeholder="Endpoint IP" disabled={!isStaticVal} />
            </Form.Item>

            <Form.Item
              label="Default Host"
              name="isdefault"
              valuePropName="checked"
              rules={[{ required: true }]}
              data-nmui-intercom="update-host-form_isdefault"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="Auto Update"
              name="autoupdate"
              valuePropName="checked"
              rules={[{ required: true }]}
              data-nmui-intercom="update-node-form_autoupdate"
            >
              <Switch />
            </Form.Item>
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />

        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item noStyle data-nmui-intercom="update-host-form_submit">
                <Button type="primary" onClick={updateHost}>
                  Update Host
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
