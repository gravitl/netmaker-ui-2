import { EditOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Input, Modal, Radio, Row, Select, Switch, theme } from 'antd';
import { MouseEvent, useState } from 'react';
import '../CustomModal.scss';

interface AddNetworkModalProps {
  isOpen: boolean;
  onCreateNetwork?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function AddNetworkModal({ isOpen, onCreateNetwork: onCreateNetwork, onCancel }: AddNetworkModalProps) {
  const [form] = Form.useForm();
  const { token: themeToken } = theme.useToken();

  const [hasIpv4, setHasIpv4] = useState(true);
  const [hasIpv6, setHasIpv6] = useState(false);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Network</span>}
      open={isOpen}
      onOk={onCreateNetwork}
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

        <Form
          form={form}
          layout="vertical"
          // style={{ maxWidth: 600 }}
        >
          <Form.Item label="Network name">
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
                    <Form.Item style={{ marginBottom: '0px' }}>
                      <Input placeholder="Enter address range" />
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
                    <Form.Item style={{ marginBottom: '0px' }}>
                      <Input placeholder="Enter address range" />
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
              <Row justify="space-between" style={{ marginBottom: hasIpv6 ? '.5rem' : '0px' }}>
                <Col>Default Access Control</Col>
                <Col xs={8}>
                  <Select size="small" style={{ width: '100%' }}>
                    <Select.Option>ALLOW</Select.Option>
                    <Select.Option>DENY</Select.Option>
                  </Select>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item label="Default Client DNS">
            <Input placeholder="Default Client DNS" />
          </Form.Item>

          <Form.Item>
            <Button type="primary">Create Network</Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
