import AddDnsModal from '@/components/modals/add-dns-modal/AddDnsModal';
import { DNS } from '@/models/Dns';
import { Network } from '@/models/Network';
import { AppRoutes } from '@/routes';
import { NetworksService } from '@/services/NetworksService';
import { useStore } from '@/store/store';
import { convertUiNetworkToNetworkModel, isNetworkIpv4, isNetworkIpv6 } from '@/utils/NetworkUtils';
import { getHostRoute } from '@/utils/RouteUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import {
  DeleteOutlined,
  DeleteRowOutlined,
  ExclamationCircleFilled,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  Layout,
  MenuProps,
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
  const [searchHost, setSearchHost] = useState('');
  const [searchDns, setSearchDns] = useState('');
  const [dnses, setDnses] = useState<DNS[]>([]);
  const [isAddDnsModalOpen, setIsAddDnsModalOpen] = useState(false);

  const networkHosts = useMemo(
    () =>
      store.nodes
        .filter((node) => node.network === networkId)
        // TODO: add name search
        .filter((node) => node.address.toLowerCase().includes(searchHost.toLowerCase())),
    [store.nodes, networkId, searchHost]
  );

  const goToNewHostPage = useCallback(() => {
    navigate(AppRoutes.NEW_HOST_ROUTE);
  }, [navigate]);

  const confirmDeleteDns = useCallback(
    (dns: DNS) => {
      Modal.confirm({
        title: `Delete DNS ${dns.name}.${dns.network}`,
        content: `Are you sure you want to delete this DNS?`,
        onOk: async () => {
          try {
            await NetworksService.deleteDns(dns.network, dns.name);
            setDnses((dnses) => dnses.filter((dns) => dns.name !== dns.name));
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error deleting DNS',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify]
  );

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
                  placeholder="Search hosts"
                  value={searchHost}
                  onChange={(ev) => setSearchHost(ev.target.value)}
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
                  render: (_, node) => {
                    const hostName = store.hostsCommonDetails[node.hostid].name;
                    // TODO: fix broken link
                    return <Link to={getHostRoute(hostName)}>{hostName}</Link>;
                  },
                },
                {
                  title: 'Private Address',
                  dataIndex: 'address',
                  render: (address: string, node) => (
                    <>
                      <Typography.Text copyable>{address}</Typography.Text>
                      <Typography.Text copyable={!!node.address6}>{node.address6}</Typography.Text>
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
    [goToNewHostPage, networkHosts, searchHost, store.hostsCommonDetails]
  );

  const getDnsContent = useCallback(
    (network: Network) => {
      return (
        <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Card style={{ width: '100%' }}>
            <Row justify="space-between" style={{ marginBottom: '1rem' }}>
              <Col xs={12} md={8}>
                <Input
                  size="large"
                  placeholder="Search DNS"
                  value={searchDns}
                  onChange={(ev) => setSearchDns(ev.target.value)}
                />
              </Col>
              <Col xs={12} md={6} style={{ textAlign: 'right' }}>
                <Button type="primary" size="large" onClick={() => setIsAddDnsModalOpen(true)}>
                  <PlusOutlined /> Add DNS
                </Button>
              </Col>
            </Row>

            <Table
              columns={[
                {
                  title: 'DNS Entry',
                  render(_, dns) {
                    return <Typography.Text copyable>{`${dns.name}.${dns.network}`}</Typography.Text>;
                  },
                },
                {
                  title: 'IP Addresses',
                  render(_, dns) {
                    return (
                      <Typography.Text copyable>
                        {dns.address}
                        {dns.address6 && `, ${dns.address6}`}
                      </Typography.Text>
                    );
                  },
                },
                {
                  title: 'Action',
                  key: 'action',
                  width: '1rem',
                  render: (_, dns) => (
                    <Dropdown
                      placement="bottomRight"
                      menu={{
                        items: [
                          {
                            key: 'delete',
                            label: (
                              <Typography.Text onClick={() => confirmDeleteDns(dns)}>
                                <DeleteOutlined /> Delete
                              </Typography.Text>
                            ),
                          },
                        ] as MenuProps['items'],
                      }}
                    >
                      <MoreOutlined />
                    </Dropdown>
                  ),
                },
              ]}
              dataSource={dnses}
              rowKey="name"
            />
          </Card>
        </div>
      );
    },
    [confirmDeleteDns, dnses, searchDns]
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
        children: network ? getDnsContent(network) : <Skeleton active />,
      },
    ],
    [network, getOverviewContent, getHostsContent, getDnsContent]
  );

  const loadDnses = useCallback(async () => {
    try {
      if (!networkId) return;
      const dnses = (await NetworksService.getDnses()).data;
      const networkDnses = dnses.filter((dns) => dns.network === networkId);
      setDnses(networkDnses);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Error loading DNSes',
          description: extractErrorMsg(err),
        });
      }
    }
  }, [networkId, notify]);

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
    loadDnses();
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, networkId, notify, store.networks, loadDnses]);

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

  const onCreateDns = useCallback((dns: DNS) => {
    setDnses((prevDnses) => [...prevDnses, dns]);
    setIsAddDnsModalOpen(false);
  }, []);

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

  if (!networkId) {
    navigate(AppRoutes.NETWORKS_ROUTE);
    return null;
  }

  return (
    <Layout.Content
      className="NetworkDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding">
          <Col xs={24}>
            <Link to={AppRoutes.NETWORKS_ROUTE}>View All Networks</Link>
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
      <AddDnsModal isOpen={isAddDnsModalOpen} networkId={networkId} onCreateDns={onCreateDns} />
    </Layout.Content>
  );
}
