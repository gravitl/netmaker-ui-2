import { EditOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select, Switch, theme } from 'antd';
import { MouseEvent, useCallback } from 'react';
import { CreateNetworkDto } from '@/services/dtos/CreateNetworkDto';
import { NetworksService } from '@/services/NetworksService';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Network } from '@/models/Network';
import {
  convertNetworkPayloadToUiNetwork,
  generateCIDR,
  generateCIDR6,
  generateNetworkName,
} from '@/utils/NetworkUtils';
import { convertUiNetworkToNetworkPayload } from '@/utils/NetworkUtils';

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

  const isIpv4Val = Form.useWatch('isipv4', form);
  const isIpv6Val = Form.useWatch('isipv6', form);

  const resetModal = () => {
    form.resetFields();
  };

  const createNetwork = async () => {
    try {
      const formData = await form.validateFields();
      const network = convertNetworkPayloadToUiNetwork(
        (await NetworksService.createNetwork(convertUiNetworkToNetworkPayload(formData as unknown as Network))).data,
      );
      store.addNetwork(network);
      notify.success({ message: `Network ${network.netid} created` });
      onCreateNetwork(network);
      resetModal();
    } catch (err) {
      notify.error({
        message: 'Failed to create network',
        description: extractErrorMsg(err as any),
      });
    }
  };

  const autoFillDetails = useCallback(() => {
    form.setFieldValue('isipv4', true);
    form.setFieldsValue({
      netid: generateNetworkName(),
      addressrange: generateCIDR(),
      addressrange6: isIpv6Val ? generateCIDR6() : '',
      defaultacl: 'yes',
      defaultDns: '',
    });
  }, [form, isIpv6Val]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Network</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <div className="" style={{ marginBottom: '2rem' }}>
          <Button onClick={() => autoFillDetails()}>
            <EditOutlined /> Autofill
          </Button>
        </div>

        <Form
          name="add-network-form"
          form={form}
          layout="vertical"
          initialValues={{ isipv4: true, isipv6: false, defaultacl: 'yes' }}
        >
          <Form.Item
            label="Network name"
            name="netid"
            rules={[{ required: true }]}
            data-nmui-intercom="add-network-form_netid"
          >
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
              <Row justify="space-between" style={{ marginBottom: isIpv4Val ? '.5rem' : '0px' }}>
                <Col>IPv4</Col>
                <Col>
                  <Form.Item name="isipv4" noStyle valuePropName="checked" data-nmui-intercom="add-network-form_isipv4">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              {isIpv4Val && (
                <Row>
                  <Col xs={24}>
                    <Form.Item
                      name="addressrange"
                      style={{ marginBottom: '0px' }}
                      data-nmui-intercom="add-network-form_addressrange"
                    >
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
              <Row justify="space-between" style={{ marginBottom: isIpv6Val ? '.5rem' : '0px' }}>
                <Col>IPv6</Col>
                <Col>
                  <Form.Item name="isipv6" noStyle valuePropName="checked" data-nmui-intercom="add-network-form_isipv6">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              {isIpv6Val && (
                <Row>
                  <Col xs={24}>
                    <Form.Item name="addressrange6" style={{ marginBottom: '0px' }}>
                      <Input
                        placeholder="Enter address CIDR (eg: 2002::1234:abcd:ffff:c0a8:101/64)"
                        data-nmui-intercom="add-network-form_addressrange6"
                      />
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
                  <Form.Item
                    name="defaultacl"
                    style={{ marginBottom: '0px' }}
                    rules={[{ required: true }]}
                    data-nmui-intercom="add-network-form_defaultacl"
                  >
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

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item data-nmui-intercom="add-network-form_submit">
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
