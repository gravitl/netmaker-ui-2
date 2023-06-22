import { Network } from '@/models/Network';
import { AppRoutes } from '@/routes';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Layout, Row, Skeleton, Table, TableColumnsType, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddNetworkModal from '../../components/modals/add-network-modal/AddNetworkModal';
import { PageProps } from '../../models/Page';
import { useStore } from '../../store/store';

import './NetworksPage.scss';
import { getNetworkRoute } from '@/utils/RouteUtils';

export default function NetworksPage(props: PageProps) {
  const store = useStore();
  const navigate = useNavigate();

  const networks = store.networks;
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const tableColumns: TableColumnsType<Network> = [
    {
      title: 'Name',
      dataIndex: 'netid',
      key: 'netid',
      sorter: {
        compare: (a, b) => a.netid.localeCompare(b.netid),
      },
      defaultSortOrder: 'ascend',
      render: (netId) => <Link to={`${AppRoutes.NETWORKS_ROUTE}/${netId}`}>{netId}</Link>,
    },
    {
      title: 'Address Range (IPv4)',
      dataIndex: 'addressrange',
      key: 'addressrange',
      render: (addressRange) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          <Typography.Text>{addressRange}</Typography.Text>
        </div>
      ),
    },
    {
      title: 'Address Range (IPv6)',
      dataIndex: 'addressrange6',
      key: 'addressrange6',
      render: (addressRange6) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          <Typography.Text>{addressRange6}</Typography.Text>
        </div>
      ),
    },
    {
      title: 'Hosts Count',
      render(_, network) {
        const nodeCount = store.nodes?.filter((node) => node.network === network.netid).length ?? 0;
        return (
          <div onClick={(ev) => ev.stopPropagation()}>
            <Typography.Text>{nodeCount}</Typography.Text>
          </div>
        );
      },
    },
    {
      title: 'Network Last Modified',
      dataIndex: 'networklastmodified',
      key: 'networklastmodified',
      render: (date) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          <Typography.Text>{new Date(date * 1000).toLocaleString()}</Typography.Text>
        </div>
      ),
    },
    {
      title: 'Hosts Last Modified',
      dataIndex: 'nodeslastmodified',
      key: 'nodeslastmodified',
      render: (date) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          <Typography.Text>{new Date(date * 1000).toLocaleString()}</Typography.Text>
        </div>
      ),
    },
  ];

  const filteredNetworks = useMemo(
    () =>
      networks.filter((network) => {
        return network.netid.toLowerCase().includes(searchText.toLowerCase());
      }),
    [networks, searchText]
  );

  const loadNetworks = useCallback(async () => {
    await store.fetchNetworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  return (
    <Layout.Content
      className="NetworksPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={store.isFetchingNetworks} active title={true} className="page-padding">
        {networks.length === 0 && (
          <>
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <Col xs={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  Networks
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  A network is how your hosts and clients communicate. Each machine gets a private IP address within the
                  defined subnet and communicates securely with all the other devices in the network. The network is
                  your base layer. Once it&apos;s created you can add Ingress, Egress, Relay, and more. Create multiple
                  networks and manage multiple secure domains for your devices!
                </Typography.Text>
              </Col>
              <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a Network</Typography.Title>
                  <Typography.Text>
                    Enable fast and secure connections between your devices. Create a network, and then add your hosts.
                  </Typography.Text>
                  <Row style={{ marginTop: 'auto' }}>
                    <Col>
                      <Button type="primary" size="large" onClick={() => setIsAddNetworkModalOpen(true)}>
                        <PlusOutlined /> Add a Network
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: '8rem', marginBottom: '4rem', padding: '0px 5.125rem' }} gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Add a Network</Typography.Title>
              </Col>

              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Define a subnet
                  </Typography.Title>
                  <Typography.Text>
                    Your devices will each get an IP address within the subnet you define. You should use a{' '}
                    <a
                      href="https://www.arin.net/reference/research/statistics/address_filters/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      private range
                    </a>
                    . If you use the auto-fill feature, we will choose a private range for you. Most of the time, a /24
                    range is more than enough, as it can hold 254 devices. If you think you need more, use a /16, which
                    can hold 64,000.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Define a default ACL policy
                  </Typography.Title>
                  <Typography.Text>
                    You can use either a default policy of ALLOW or DENY. Typically, you want ALLOW, and then any device
                    you add to the network can reach all the others. Sometimes, you want to manually define all the
                    connections, in which case you use a default of DENY. In either case, as devices are added, you can
                    manually modify which devices can connect using the ACL list on the network.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    After Creation
                  </Typography.Title>
                  <Typography.Text>
                    Add hosts to your network. Make a host into a{' '}
                    <a href="https://www.netmaker.io/features/ingress" target="_blank" rel="noreferrer">
                      Client Gateway
                    </a>{' '}
                    to begin using Clients. Make a host an{' '}
                    <a href="https://www.netmaker.io/features/egress" target="_blank" rel="noreferrer">
                      egress gateway
                    </a>{' '}
                    to begin forwarding traffic to external networks like an office, data center, or the internet. Use{' '}
                    <a href="https://www.netmaker.io/features/acls" target="_blank" rel="noreferrer">
                      ACLs
                    </a>{' '}
                    to shape your network.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
        {networks.length > 0 && (
          <>
            <Row className="page-row-padding">
              <Col xs={24}>
                <Typography.Title level={3}>Networks</Typography.Title>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={12} md={8}>
                <Input
                  size="large"
                  placeholder="Search networks"
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
                />
              </Col>
              <Col xs={12} md={6} style={{ textAlign: 'right' }}>
                <Button type="primary" size="large" onClick={() => setIsAddNetworkModalOpen(true)}>
                  <PlusOutlined /> Create Network
                </Button>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24}>
                <Table
                  columns={tableColumns}
                  dataSource={filteredNetworks}
                  rowKey="netid"
                  onRow={(network) => {
                    return {
                      onClick: () => {
                        navigate(getNetworkRoute(network));
                      },
                    };
                  }}
                />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* modals */}
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={() => {
          setIsAddNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddNetworkModalOpen(false)}
      />
    </Layout.Content>
  );
}
