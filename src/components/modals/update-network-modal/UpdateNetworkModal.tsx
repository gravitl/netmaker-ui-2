import { EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select, Switch, theme, Tooltip } from 'antd';
import { MouseEvent, MutableRefObject, Ref, useCallback } from 'react';
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
  isValidIpv4Cidr,
  isValidIpv6Cidr,
} from '@/utils/NetworkUtils';
import { convertUiNetworkToNetworkPayload } from '@/utils/NetworkUtils';

interface UpdateNetworkModalProps {
  isOpen: boolean;
  onCreateNetwork: (network: Network) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  autoFillButtonRef?: MutableRefObject<HTMLButtonElement | null>;
  networkNameInputRef?: Ref<HTMLDivElement> | null;
  ipv4InputRef?: Ref<HTMLDivElement> | null;
  ipv6InputRef?: Ref<HTMLDivElement> | null;
  defaultAclInputRef?: Ref<HTMLDivElement> | null;
  submitButtonRef?: MutableRefObject<HTMLButtonElement | null>;
}

export default function UpdateNetworkModal({
  isOpen,
  onCreateNetwork: onCreateNetwork,
  onCancel,
  autoFillButtonRef,
  networkNameInputRef,
  ipv4InputRef,
  ipv6InputRef,
  defaultAclInputRef,
  submitButtonRef,
}: UpdateNetworkModalProps) {
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
    form.setFieldsValue({
      // netid: generateNetworkName(),
      addressrange: isIpv4Val ? generateCIDR() : '',
      addressrange6: isIpv6Val ? generateCIDR6() : '',
      defaultacl: 'yes',
      defaultDns: '',
    });
  }, [form, isIpv4Val, isIpv6Val]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold', width: '700px' }}>Create a Network</span>}
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
          <Button onClick={() => autoFillDetails()} ref={autoFillButtonRef}>
            <EditOutlined /> Autofill
          </Button>
        </div>

        <Form
          name="add-network-form"
          form={form}
          layout="vertical"
          initialValues={{
            isipv4: true,
            isipv6: false,
            defaultacl: 'yes',
          }}
        >
          <Row ref={networkNameInputRef}>
            <Col xs={24}>
              <Form.Item
                label="Network name"
                name="netid"
                rules={[{ required: true }]}
                data-nmui-intercom="add-network-form_netid"
              >
                <Input placeholder="Network name" />
              </Form.Item>
            </Col>
          </Row>

          {/* ipv4 */}
          <Row
            style={{
              border: `1px solid ${themeToken.colorBorder}`,
              borderRadius: '8px',
              padding: '.5rem',
              marginBottom: '1.5rem',
            }}
            ref={ipv4InputRef}
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
                      rules={[
                        {
                          validator: (_: any, ipv4: string) => {
                            if (isValidIpv4Cidr(ipv4)) {
                              return Promise.resolve();
                            } else {
                              return Promise.reject('Address range must be a valid IPv4 CIDR');
                            }
                          },
                        },
                      ]}
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
            ref={ipv6InputRef}
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
                    <Form.Item
                      name="addressrange6"
                      data-nmui-intercom="add-network-form_addressrange6"
                      style={{ marginBottom: '0px' }}
                      rules={[
                        {
                          validator: (_: any, ipv6: string) => {
                            if (isValidIpv6Cidr(ipv6)) {
                              return Promise.resolve();
                            } else {
                              return Promise.reject('Address range must be a valid IPv6 CIDR');
                            }
                          },
                        },
                      ]}
                    >
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
            ref={defaultAclInputRef}
          >
            <Col xs={24}>
              <Row justify="space-between">
                <Col>
                  Default Access Control{' '}
                  <Tooltip title="The default access control rule for any device added to the the network">
                    {' '}
                    <InfoCircleOutlined />
                  </Tooltip>{' '}
                </Col>
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
                <Button type="primary" onClick={createNetwork} ref={submitButtonRef}>
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
