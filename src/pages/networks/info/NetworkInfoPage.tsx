import { Network } from '@/models/Network';
import { useStore } from '@/store/store';
import { useGetActiveNetwork } from '@/utils/Utils';
import { Card, Col, Form, Input, notification, Row, Select, Switch, theme } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface NetworkInfoPageProps {
  networkId?: string;
  isFullScreen: boolean;
}

export default function NetworkInfoPage({ isFullScreen }: NetworkInfoPageProps) {
  const store = useStore();
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();

  const [form] = Form.useForm<Network>();
  const isIpv4Watch = Form.useWatch('isipv4', form);
  const isIpv6Watch = Form.useWatch('isipv6', form);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isEditingNetwork, setIsEditingNetwork] = useState(false);

  useEffect(() => {
    if (!isLoadingNetwork) {
      form.setFieldsValue(network ?? {});
    }
    setIsInitialLoad(false);
  }, [form, isInitialLoad, isLoadingNetwork, network]);

  return (
    <div className="relative h-full">
      <Row style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
        <Card className="overview-card" style={{ width: '50%', minWidth: '1360px' }}>
          <Form
            name="network-details-form"
            form={form}
            layout="vertical"
            initialValues={network ?? undefined}
            disabled={!isEditingNetwork}
          >
            <Form.Item
              label="Network name"
              name="netid"
              rules={[{ required: true }]}
              data-nmui-intercom="network-details-form_netid"
            >
              <Input placeholder="Network name" disabled={!isEditingNetwork} />
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
                <Row justify="space-between" style={{ marginBottom: isIpv4Watch ? '.5rem' : '0px' }}>
                  <Col>IPv4</Col>
                  <Col>
                    <Form.Item
                      name="isipv4"
                      valuePropName="checked"
                      style={{ marginBottom: '0px' }}
                      data-nmui-intercom="network-details-form_isipv4"
                    >
                      <Switch disabled={!isEditingNetwork} />
                    </Form.Item>
                  </Col>
                </Row>
                {isIpv4Watch && (
                  <Row>
                    <Col xs={24}>
                      <Form.Item
                        name="addressrange"
                        style={{ marginBottom: '0px' }}
                        data-nmui-intercom="network-details-form_addressrange"
                      >
                        <Input placeholder="Enter address CIDR (eg: 100.64.1.0/24)" disabled={!isEditingNetwork} />
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
                <Row justify="space-between" style={{ marginBottom: isIpv6Watch ? '.5rem' : '0px' }}>
                  <Col>IPv6</Col>
                  <Col>
                    <Form.Item
                      name="isipv6"
                      valuePropName="checked"
                      style={{ marginBottom: '0px' }}
                      data-nmui-intercom="network-details-form_isipv6"
                    >
                      <Switch disabled />
                    </Form.Item>
                  </Col>
                </Row>
                {isIpv6Watch && (
                  <Row>
                    <Col xs={24}>
                      <Form.Item
                        name="addressrange6"
                        style={{ marginBottom: '0px' }}
                        data-nmui-intercom="network-details-form_addressrange6"
                      >
                        <Input
                          placeholder="Enter address CIDR (eg: fd::1234:abcd:ffff:c0a8:101/64)"
                          disabled={!isEditingNetwork}
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
                      data-nmui-intercom="network-details-form_defaultacl"
                    >
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        options={[
                          { label: 'ALLOW', value: 'yes' },
                          { label: 'DENY', value: 'no' },
                        ]}
                        disabled
                      ></Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
            {/* TODO: Bring back if needed */}
            {/* <Row
              style={{
                border: `1px solid ${themeToken.colorBorder}`,
                borderRadius: '8px',
                padding: '.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Col xs={24}>
                <Row justify="space-between" align="middle">
                  {!usecase && (
                    <Alert
                      message="Your network is missing a usecase, please add one or if you know your way around you can ignore"
                      type="warning"
                      showIcon
                      style={{ marginBottom: '1rem' }}
                    />
                  )}
                  <Col>Primary usecase for network</Col>
                  <Col md={8}>
                    <Form.Item
                      name="defaultUsecase"
                      style={{ marginBottom: '0px' }}
                      rules={[{ required: false }]}
                      data-nmui-intercom="add-network-form_usecase"
                      initialValue={usecase}
                    >
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        options={Object.keys(networkUsecaseMapText).map((key) => {
                          return { label: networkUsecaseMapText[key as NetworkUsecaseString], value: key };
                        })}
                        onChange={onUpdateUsecase}
                      ></Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row> */}
          </Form>
        </Card>
      </Row>

      {/* misc */}
      {notifyCtx}
    </div>
  );
}
