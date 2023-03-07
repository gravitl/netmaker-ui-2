import { Network } from '@/models/Network';
import { AppRoutes } from '@/routes';
import { NetworksService } from '@/services/NetworksService';
import { useStore } from '@/store/store';
import { convertUiNetworkToNetworkModel, isNetworkIpv4, isNetworkIpv6 } from '@/utils/Networks';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  Modal,
  notification,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  Tabs,
  TabsProps,
  theme,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const isIpv4Watch = Form.useWatch('isipv4', form);
  const isIpv6Watch = Form.useWatch('isipv6', form);
  const [network, setNetwork] = useState<Network | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const networkHosts = useMemo(
    () =>
      store.nodes
        .filter((node) => node.network === networkId)
        // TODO: add name search
        .filter((node) => node.address.toLowerCase().includes(searchText.toLowerCase())),
    [store.nodes, networkId, searchText]
  );

  const goToNewHostPage = () => {
    navigate(AppRoutes.NEW_HOST_ROUTE);
  };

  const getOverviewContent = useCallback(
    (network: Network) => {
      return (
        <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
                  <Row justify="space-between" style={{ marginBottom: isIpv4Watch ? '.5rem' : '0px' }}>
                    <Col>IPv4</Col>
                    <Col>
                      <Form.Item name="isipv4" style={{ marginBottom: '0px' }}>
                        <Switch defaultChecked={isNetworkIpv4(form.getFieldsValue())} />
                      </Form.Item>
                    </Col>
                  </Row>
                  {isIpv4Watch && (
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
                  <Row justify="space-between" style={{ marginBottom: isIpv6Watch ? '.5rem' : '0px' }}>
                    <Col>IPv6</Col>
                    <Col>
                      <Form.Item name="isipv6" style={{ marginBottom: '0px' }}>
                        <Switch defaultChecked={isNetworkIpv6(form.getFieldsValue())} />
                      </Form.Item>
                    </Col>
                  </Row>
                  {isIpv6Watch && (
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
        </div>
      );
    },
    [form, isEditing, themeToken, isIpv4Watch, isIpv6Watch]
  );

  const getHostsContent = useCallback(
    (network: Network) => {
      return (
        <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Card style={{ width: '100%' }}>
            <Row justify="space-between" style={{ marginBottom: '1rem' }}>
              <Col xs={12} md={8}>
                <Input
                  size="large"
                  placeholder="Search networks"
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
                />
              </Col>
              <Col xs={12} md={6} style={{ textAlign: 'right' }}>
                <Button type="primary" size="large" onClick={goToNewHostPage}>
                  <PlusOutlined /> Add Host
                </Button>
              </Col>
            </Row>

            <Table
              columns={[
                {
                  title: 'Host Name',
                  render: (_, node) => <span>{store.hostsCommonDetails[node.hostid].name}</span>,
                },
                {
                  title: 'Private Address',
                  dataIndex: 'address',
                  render: (address: string, node) => (
                    <>
                      <span>{address}</span>
                      <span>{node.address6}</span>
                    </>
                  ),
                },
                {
                  title: 'Public Address',
                  dataIndex: 'name',
                },
                {
                  title: 'Preferred DNS',
                  dataIndex: 'name',
                },
                {
                  title: 'Health Status',
                  dataIndex: 'name',
                },
                {
                  title: 'Connection status',
                  // dataIndex: 'name',
                },
              ]}
              dataSource={networkHosts}
              rowKey="id"
            />
          </Card>
        </div>
      );
    },
    [goToNewHostPage, networkHosts, searchText, store.hostsCommonDetails]
  );

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
        children: network ? getHostsContent(network) : <Skeleton active />,
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
      {
        key: 'dns',
        label: `DNS`,
        children: `Content of DNS Tab`,
      },
    ],
    [network, getOverviewContent, getHostsContent]
  );

  const loadNetwork = useCallback(() => {
    // TODO: remove
    store.fetchNodes();
    store.fetchHosts();

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
  }, [navigate, networkId, notify, store.networks]);

  const onNetworkFormEdit = useCallback(async () => {
    try {
      const formData = await form.validateFields();
      if (!networkId) {
        throw new Error('Network not found');
      }
      const network = (await NetworksService.updateNetwork(networkId, convertUiNetworkToNetworkModel(formData))).data;
      store.updateNetwork(networkId, network);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to save changes',
          description: extractErrorMsg(err),
        });
      } else {
        notify.error({
          message: err instanceof Error ? err.message : 'Failed to save changes',
        });
      }
    }
  }, [form, networkId, notify, store]);

  const onNetworkDelete = useCallback(async () => {
    try {
      if (!networkId) {
        throw new Error('Network not found');
      }
      await NetworksService.deleteNetwork(networkId);
      store.deleteNetwork(networkId);
      navigate(AppRoutes.NETWORKS_ROUTE);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to delete network',
          description: extractErrorMsg(err),
        });
      } else {
        notify.error({
          message: err instanceof Error ? err.message : 'Failed to delete network',
        });
      }
    }
  }, [networkId, notify, navigate, store]);

  const promptConfirmDelete = () => {
    Modal.confirm({
      title: `Do you want to delete network ${network?.netid}?`,
      icon: <ExclamationCircleFilled />,
      onOk() {
        onNetworkDelete();
      },
    });
  };

  useEffect(() => {
    loadNetwork();
  }, [loadNetwork]);

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
                  <Button type="primary" style={{ marginRight: '.5rem' }} onClick={onNetworkFormEdit}>
                    Save Changes
                  </Button>
                )}
                <Button type="default" onClick={promptConfirmDelete}>
                  Delete
                </Button>
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
