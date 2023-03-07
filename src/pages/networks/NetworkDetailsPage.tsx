import { Network } from '@/models/Network';
import { AppRoutes } from '@/routes';
import { useStore } from '@/store/store';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  notification,
  Row,
  Select,
  Skeleton,
  Switch,
  Tabs,
  TabsProps,
  theme,
  Typography,
} from 'antd';
import form from 'antd/es/form';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageProps } from '../../models/Page';

import './NetworkDetailsPage.scss';

export default function NetworkDetailsPage(props: PageProps) {
  const { networkId } = useParams<{ networkId: string }>();
  const store = useStore();
  const navigate = useNavigate();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const [form] = Form.useForm<Network>();

  const [network, setNetwork] = useState<Network | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getOverviewContent = (network: Network) => {
    return (
      <Card style={{ width: '50%' }}>
        <Form name="add-network-form" form={form} layout="vertical" initialValues={network} disabled={!isEditing}>
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
              <Row justify="space-between" style={{ marginBottom: network?.isipv4 ? '.5rem' : '0px' }}>
                <Col>IPv4</Col>
                <Col>
                  <Form.Item name="isipv4">
                    <Switch checked={network?.isipv4 === 'yes'} />
                  </Form.Item>
                </Col>
              </Row>
              {network?.isipv4 && (
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
              <Row justify="space-between" style={{ marginBottom: network?.isipv6 ? '.5rem' : '0px' }}>
                <Col>IPv6</Col>
                <Col>
                  <Switch checked={network?.isipv6 === 'yes'} />
                </Col>
              </Row>
              {network?.isipv6 && (
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
        </Form>
      </Card>
    );
  };

  const items: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'overview',
        label: `Overview`,
        children: network ? getOverviewContent(network) : <Skeleton active />,
      },
      {
        key: 'hosts',
        label: `Hosts (#)`,
        children: `Content of Hosts Tab`,
      },
      {
        key: 'graph',
        label: `Graph`,
        children: `Content of Graph Tab`,
      },
      {
        key: 'acls',
        label: `ACLs`,
        children: `Content of ACLs Tab`,
      },
      {
        key: 'clients',
        label: `Clients`,
        children: `Content of Clients Tab`,
      },
    ],
    [network, isEditing]
  );

  const loadNetwork = () => {
    setIsLoading(true);
    // route to networks if id is not present
    if (!networkId) {
      navigate(AppRoutes.NETWORKS_ROUTE);
    }
    // load from store
    const network = store.networks.find((network) => network.netid === networkId);
    if (!network) {
      notify.error({ message: `Network ${networkId} not found` });
      navigate(AppRoutes.NETWORKS_ROUTE);
      return;
    }
    setNetwork(network);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  return (
    <Layout.Content
      className="NetworkDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding">
          <Col xs={24}>
            <Button type="link" style={{ padding: '0px' }}>
              <small></small>
              <Typography.Link>
                <Link to={AppRoutes.NETWORKS_ROUTE}>View All Networks</Link>
              </Typography.Link>
            </Button>
            <Row>
              <Col xs={18}>
                <Typography.Title level={2} copyable style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  {network?.netid}
                </Typography.Title>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                {!isEditing && (
                  <Button type="default" style={{ marginRight: '.5rem' }} onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <Button type="primary" style={{ marginRight: '.5rem' }} onClick={() => setIsEditing(false)}>
                    Save Changes
                  </Button>
                )}
                <Button type="default">Delete</Button>
              </Col>
            </Row>

            <Tabs items={items} />
          </Col>
        </Row>
      </Skeleton>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
