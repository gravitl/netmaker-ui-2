import { InfoCircleOutlined } from '@ant-design/icons';
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
  generateCgnatCIDR,
  generateCgnatCIDR6,
  isPrivateIpCidr,
  isValidIpv4Cidr,
  isValidIpv6Cidr,
} from '@/utils/NetworkUtils';
import { convertUiNetworkToNetworkPayload } from '@/utils/NetworkUtils';
import { ShuffleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '@/routes';

interface AddNetworkModalProps {
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

export default function AddNetworkModal({
  isOpen,
  onCreateNetwork: onCreateNetwork,
  onCancel,
  networkNameInputRef,
  ipv4InputRef,
  ipv6InputRef,
  defaultAclInputRef,
  submitButtonRef,
}: AddNetworkModalProps) {
  const [form] = Form.useForm<CreateNetworkDto>();
  const { token: themeToken } = theme.useToken();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const navigate = useNavigate();

  const isIpv4Val = Form.useWatch('isipv4', form);
  const isIpv6Val = Form.useWatch('isipv6', form);

  const resetModal = () => {
    form.resetFields();
  };

  const createNetwork = async () => {
    try {
      const formData = await form.validateFields();
      formData.netid = formData.netid?.trim() ?? '';
      formData.netid = formData.netid.replace(/\s+/g, '-');
      formData.netid = formData.netid.toLocaleLowerCase();
      formData.name = formData.netid;

      // Check if network name already exists
      const nameExists = store.networks.some((n) => n.name === formData.name);

      if (nameExists) {
        notify.error({
          message: 'Duplicate Network Name',
          description: 'A network with this name already exists. Please choose a different name.',
        });
        return;
      }

      const network = convertNetworkPayloadToUiNetwork(
        (await NetworksService.createNetwork(convertUiNetworkToNetworkPayload(formData as unknown as Network))).data,
      );
      store.addNetwork(network);
      notify.success({ message: `Network ${network.name || network.netid} created` });
      store.setActiveNetwork(network.netid);
      resetModal();
      onCreateNetwork(network);
      navigate(AppRoutes.NETWORK_NODES_ROUTE.replace(':networkId', network.netid));
    } catch (err) {
      notify.error({
        message: 'Failed to create network',
        description: extractErrorMsg(err as any),
      });
    }
  };
  const autoFillCIDR = useCallback(
    (isIpV4: boolean) => {
      if (isIpV4) {
        const addressRange = generateCgnatCIDR();
        // check if a network with the same address range exists
        const network = store.networks.find((n) => n.addressrange === addressRange);
        if (network) {
          autoFillCIDR(true);
          return;
        }
        return addressRange;
      } else {
        const addressRange = generateCgnatCIDR6();
        // check if a network with the same address range exists
        const network = store.networks.find((n) => n.addressrange6 === addressRange);
        if (network) {
          autoFillCIDR(false);
          return;
        }
        return addressRange;
      }
    },
    [store.networks],
  );

  const autoFillDetails = useCallback(
    (type: 'ipv4' | 'ipv6') => {
      form.setFieldsValue({
        // netid: generateNetworkName(),
        addressrange: type === 'ipv4' && isIpv4Val ? autoFillCIDR(true) : form.getFieldValue('addressrange'),
        addressrange6: type === 'ipv6' && isIpv6Val ? autoFillCIDR(false) : form.getFieldValue('addressrange6'),
        defaultacl: 'yes',
        defaultDns: '',
      });
      form.validateFields();
    },
    [autoFillCIDR, form, isIpv4Val, isIpv6Val],
  );

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
                label={
                  <>
                    Network Name
                    <Tooltip title="The name of the network">
                      <InfoCircleOutlined style={{ marginLeft: '.5rem', opacity: '.7' }} />
                    </Tooltip>
                  </>
                }
                name="netid"
                rules={[
                  {
                    required: true,
                    pattern: /^[a-zA-Z0-9 _-]+$/,
                    message:
                      'Please enter a network name. Valid characters are a-z, 0-9, space, underscore (_) and hypen (-)',
                  },
                ]}
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
                <Col>
                  IPv4
                  <Tooltip title="An IPv4 Address Range can be added to your network, and each machine will be given a private IPv4 address which is accessible from other nodes in the network.">
                    <InfoCircleOutlined style={{ marginLeft: '.5rem', opacity: '.7' }} />
                  </Tooltip>
                </Col>
                <Col>
                  {isIpv4Val && (
                    <span title="Generate a random address range" onClick={() => autoFillDetails('ipv4')}>
                      <ShuffleIcon color={themeToken.colorTextSecondary} size="1rem" className="inline mr-2" />
                    </span>
                  )}
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
                      initialValue=""
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
                        {
                          warningOnly: true,
                          validator(_, value) {
                            if (isPrivateIpCidr(value)) {
                              return Promise.reject(
                                'This IP range is commonly used for LANs. Confirm that it does not overlap with your home or office network.',
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input placeholder="Enter address CIDR (eg: 100.64.1.0/24)" />
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
                <Col>
                  IPv6
                  <Tooltip title="An IPv6 Address Range can be added to your network, and each machine will be given a private IPv6 address which is accessible from other nodes in the network.">
                    <InfoCircleOutlined style={{ marginLeft: '.5rem', opacity: '.7' }} />
                  </Tooltip>
                </Col>
                <Col>
                  {isIpv6Val && (
                    <span title="Generate a random address range" onClick={() => autoFillDetails('ipv6')}>
                      <ShuffleIcon color={themeToken.colorTextSecondary} size="1rem" className="inline mr-2" />
                    </span>
                  )}
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
                      initialValue=""
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
                        {
                          warningOnly: true,
                          validator(_, value) {
                            if (isPrivateIpCidr(value)) {
                              return Promise.reject(
                                'This IP range is commonly used for LANs. Confirm that it does not overlap with your home or office network.',
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input placeholder="Enter address CIDR (eg: fd3c:49b3:973f:ee87::/64)" />
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
                  Default Access Control
                  <Tooltip title="The default access control rule for any device added to the the network">
                    <InfoCircleOutlined style={{ marginLeft: '.5rem', opacity: '.7' }} />
                  </Tooltip>
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
