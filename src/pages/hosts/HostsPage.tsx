import { Host } from '@/models/Host';
import { AppRoutes } from '@/routes';
import { useStore } from '@/store/store';
import { getHostRoute } from '@/utils/RouteUtils';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  Layout,
  notification,
  Row,
  Skeleton,
  Space,
  Switch,
  Table,
  TableColumnsType,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageProps } from '../../models/Page';

import './HostsPage.scss';

export default function HostsPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const navigate = useNavigate();

  const hosts = store.hosts;
  const storeFetchHosts = useStore((state) => state.fetchHosts);
  const [searchText, setSearchText] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const tableColumns: TableColumnsType<Host> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (value, host) => <Link to={getHostRoute(host)}>{host.name}</Link>,
      sorter(a, b) {
        return a.name.localeCompare(b.name);
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpointip',
    },
    {
      title: 'Version',
      dataIndex: 'version',
    },
    {
      title: 'Relay status',
      render(_, host) {
        let relayer: Host | undefined;

        if (host.isrelayed) {
          relayer = hosts.find((h) => h.id === host.relayed_by);
        }

        return (
          <Space direction="horizontal">
            <Tag color={host.isrelay ? 'success' : 'default'}>Relay</Tag>
            <Tag
              color={host.isrelayed ? 'blue' : 'default'}
              title={host.isrelayed ? `Relayed by "${relayer?.name}"` : ''}
            >
              Relayed
            </Tag>
          </Space>
        );
      },
    },
    {
      width: '8rem',
      title: 'Default Host',
      render(_, host) {
        // TODO: onchange
        return <Switch checked={host.isdefault} />;
      },
    },
  ];

  const filteredHosts = useMemo(
    () =>
      hosts.filter((host) => {
        return host.name.toLowerCase().includes(searchText.toLowerCase());
      }),
    [hosts, searchText]
  );

  useEffect(() => {
    storeFetchHosts();
    setHasLoaded(true);
  }, [storeFetchHosts]);

  return (
    <Layout.Content
      className="HostsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={!hasLoaded && store.isFetchingHosts} active title={true} className="page-padding">
        {hosts.length === 0 && (
          <>
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <Col xs={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  Hosts
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque amet modi cum aut doloremque dicta
                  reiciendis odit molestias nam animi enim et molestiae consequatur quas quo facere magni, maiores rem.
                </Typography.Text>
              </Col>
              <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a Key</Typography.Title>
                  <Typography.Text>
                    Hosts (netclients) can be physical or virtual machines capable of joining Netmaker networks.
                  </Typography.Text>
                  <Row style={{ marginTop: 'auto' }}>
                    <Col>
                      {/* TODO: add redirect to */}
                      <Button type="primary" size="large" onClick={() => navigate(AppRoutes.NEW_HOST_ROUTE)}>
                        <PlusOutlined /> Connect a Host
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: '8rem', padding: '0px 5.125rem' }} gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Connect a Host</Typography.Title>
              </Col>

              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Connect via Enrollment Keys
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Connect via Enrollment Keys
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Connect via Enrollment Keys
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
        {hosts.length > 0 && (
          <>
            <Row className="page-row-padding-y page-row-padding-x">
              <Col xs={24}>
                <Typography.Title level={3}>Hosts</Typography.Title>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={12} md={8}>
                <Input
                  size="large"
                  placeholder="Search hosts"
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
                />
              </Col>
              <Col xs={12} md={6} style={{ textAlign: 'right' }}>
                {/* TODO: add redirect to */}
                <Button type="primary" size="large" onClick={() => navigate(AppRoutes.NEW_HOST_ROUTE)}>
                  <PlusOutlined /> Connect a host
                </Button>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24}>
                <Table columns={tableColumns} dataSource={filteredHosts} rowKey="id" />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
