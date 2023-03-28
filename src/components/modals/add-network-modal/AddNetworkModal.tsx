import { EditOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select, Switch, theme } from 'antd';
import { MouseEvent, useState } from 'react';
import { CreateNetworkDto } from '@/services/dtos/CreateNetworkDto';
import { NetworksService } from '@/services/NetworksService';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { AxiosError } from 'axios';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Network } from '@/models/Network';
import { convertNetworkPayloadToUiNetwork } from '@/utils/NetworkUtils';

interface AddNetworkModalProps {
  isOpen: boolean;
  onCreateNetwork: (network: Network) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function AddNetworkModal({ isOpen, onCreateNetwork: onCreateNetwork, onCancel }: AddNetworkModalProps) {
  const [form] = Form.useForm<CreateNetworkDto>();
  const { token: themeToken } = theme.useToken();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const [hasIpv4, setHasIpv4] = useState(true);
  const [hasIpv6, setHasIpv6] = useState(false);

  const createNetwork = async () => {
    try {
      const formData = await form.validateFields();
      const network = convertNetworkPayloadToUiNetwork((await NetworksService.createNetwork(formData)).data);
      store.addNetwork(network);
      notify.success({ message: `Network ${network.netid} created` });
      onCreateNetwork(network);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to create network',
          description: extractErrorMsg(err),
        });
      }
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Network</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <div className="" style={{ marginBottom: '2rem' }}>
          <Button>
            <EditOutlined /> Autofill
          </Button>
        </div>

        <Form name="add-network-form" form={form} layout="vertical" initialValues={{ defaultacl: 'yes' }}>
          <Form.Item label="Network name" name="netid" rules={[{ required: true }]}>
            <Input placeholder="Network name" />
          </Form.Item>

          {/* ipv4 */}
          <Row
            style={{
              border: `1px solid ${themeToken.colorBorder}`,
              borderRadius: '8px',
              padding: '.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <Col xs={24}>
              <Row justify="space-between" style={{ marginBottom: hasIpv4 ? '.5rem' : '0px' }}>
                <Col>IPv4</Col>
                <Col>
                  <Switch checked={hasIpv4} onChange={(val) => setHasIpv4(val)} />
                </Col>
              </Row>
              {hasIpv4 && (
                <Row>
                  <Col xs={24}>
                    <Form.Item name="addressrange" style={{ marginBottom: '0px' }}>
                      <Input placeholder="Enter address CIDR (eg: 192.168.1.0/24)" />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Col>
          </Row>

          {/* ipv6 */}
          <Row
            style={{
              border: `1px solid ${themeToken.colorBorder}`,
              borderRadius: '8px',
              padding: '.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <Col xs={24}>
              <Row justify="space-between" style={{ marginBottom: hasIpv6 ? '.5rem' : '0px' }}>
                <Col>IPv6</Col>
                <Col>
                  <Switch checked={hasIpv6} onChange={(val) => setHasIpv6(val)} />
                </Col>
              </Row>
              {hasIpv6 && (
                <Row>
                  <Col xs={24}>
                    <Form.Item name="addressrange6" style={{ marginBottom: '0px' }}>
                      <Input placeholder="Enter address CIDR (eg: 2002::1234:abcd:ffff:c0a8:101/64)" />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Col>
          </Row>

          <Row
            style={{
              border: `1px solid ${themeToken.colorBorder}`,
              borderRadius: '8px',
              padding: '.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <Col xs={24}>
              <Row justify="space-between">
                <Col>Default Access Control</Col>
                <Col xs={8}>
                  <Form.Item name="defaultacl" style={{ marginBottom: '0px' }} rules={[{ required: true }]}>
                    <Select
                      size="small"
                      style={{ width: '100%' }}
                      options={[
                        { label: 'ALLOW', value: 'yes' },
                        { label: 'DENY', value: 'no' },
                      ]}
                    ></Select>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item label="Default Client DNS" name="defaultDns">
            <Input placeholder="Default Client DNS" />
          </Form.Item>

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Button type="primary" onClick={createNetwork}>
                  Create Network
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
