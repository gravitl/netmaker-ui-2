import {
  Alert,
  Button,
  Card,
  Carousel,
  Col,
  Dropdown,
  Input,
  Layout,
  Row,
  Space,
  Table,
  TableColumnsType,
  Tooltip,
  Typography,
  notification,
} from 'antd';
import {
  ArrowRightOutlined,
  DesktopOutlined,
  DownOutlined,
  GlobalOutlined,
  LaptopOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import UpgradeModal from '../components/modals/upgrade-modal/UpgradeModal';
import { PageProps } from '../models/Page';
import { AppRoutes } from '../routes';
import { Link, useNavigate } from 'react-router-dom';
import AddNetworkModal from '@/components/modals/add-network-modal/AddNetworkModal';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import { getAmuiUrl, getLicenseDashboardUrl, getNetworkRoute, resolveAppRoute } from '@/utils/RouteUtils';
import NewHostModal from '@/components/modals/new-host-modal/NewHostModal';
import { isSaasBuild } from '@/services/BaseService';
import { useBranding, useServerLicense } from '@/utils/Utils';
import QuickSetupModal from '@/components/modals/quick-setup-modal/QuickSetupModal';
import { Network } from '@/models/Network';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';

export type TourType =
  | 'relays'
  | 'egress'
  | 'remoteaccess'
  | 'networks'
  | 'hosts'
  | 'quicksetup'
  | 'remoteaccess_specificmachines_our_rac'
  | 'remoteaccess_withegress_our_rac'
  | 'remoteaccess_specificmachines_vpn_config'
  | 'remoteaccess_withegress_vpn_config'
  | 'internetgateway'
  | 'connecttosite_router'
  | 'connecttosite_netclient';

export default function DashboardPage(props: PageProps) {
  const navigate = useNavigate();
  const store = useStore();
  const branding = useBranding();

  const { isServerEE } = useServerLicense();
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNewHostModalOpen, setIsNewHostModalOpen] = useState(false);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  const [isQuickSetupModalOpen, setIsQuickSetupModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [notify, notifyCtx] = notification.useNotification();

  const jumpToTourPage = (tourType: TourType, netId?: string) => {
    if (store.networks.length === 0) {
      notification.warning({
        message: 'No networks',
        description: 'You need to create a network before you can start a tour.',
      });
      setIsAddNetworkModalOpen(true);
      return;
    }
    // jump to different pages and start tour
    switch (tourType) {
      case 'relays':
        navigate(resolveAppRoute(`${AppRoutes.NETWORKS_ROUTE}/${store.networks[0].netid}`), {
          state: { startTour: 'relays' },
        });
        break;
      case 'egress':
        navigate(resolveAppRoute(`${AppRoutes.NETWORKS_ROUTE}/${store.networks[0].netid}`), {
          state: { startTour: 'egress' },
        });
        break;
      case 'remoteaccess':
        navigate(resolveAppRoute(`${AppRoutes.NETWORKS_ROUTE}/${store.networks[0].netid}`), {
          state: { startTour: 'remoteaccess' },
        });
        break;
      case 'networks':
        navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE), { state: { startTour: 'networks' } });
        break;
      case 'hosts':
        navigate(resolveAppRoute(AppRoutes.HOSTS_ROUTE), { state: { startTour: 'hosts' } });
        break;
      default:
        navigate(resolveAppRoute(`${AppRoutes.NETWORKS_ROUTE}/${netId}`), {
          state: { startTour: tourType },
        });
        break;
    }
  };
  const filteredNetworks = useMemo(
    () =>
      store.networks.filter((network) => {
        return network.netid.toLowerCase().includes(searchText.toLowerCase());
      }),
    [store.networks, searchText],
  );

  const tableColumns: TableColumnsType<Network> = [
    {
      title: 'Name',
      dataIndex: 'netid',
      key: 'netid',
      sorter: {
        compare: (a, b) => a.netid.localeCompare(b.netid),
      },
      defaultSortOrder: 'ascend',
      render: (netId) => (
        <Link
          className="text-button-primary-fill-default"
          to={`${resolveAppRoute(AppRoutes.NETWORKS_ROUTE)}/${encodeURIComponent(netId)}`}
        >
          {netId}
        </Link>
      ),
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
      dataIndex: 'hosts',
      // render(_, network) {
      //   const nodeCount = store.nodes?.filter((node) => node.network === network.netid).length ?? 0;
      //   return (
      //     <div onClick={(ev) => ev.stopPropagation()}>
      //       <Typography.Text>{nodeCount}</Typography.Text>
      //     </div>
      //   );
      // },
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

  useEffect(() => {
    if (!isServerEE && !isSaasBuild && !store.serverStatus.status?.is_on_trial_license) {
      setShowUpgradeAlert(true);
    } else {
      setShowUpgradeAlert(false);
    }
  }, [isServerEE, store.serverStatus.status?.is_on_trial_license]);

  return (
    <Layout.Content style={{ padding: props.isFullScreen ? 0 : 24 }}>
      <Row className="dashboard-page-row">
        <Layout.Header style={{ width: '100%', padding: '0px', backgroundColor: 'transparent' }}>
          <Row>
            <Col xs={24} lg={9} xl={12}>
              {showUpgradeAlert && (
                <Alert
                  message="You are on the free plan"
                  type="warning"
                  action={
                    <Button
                      type="link"
                      onClick={() => {
                        window.location = isSaasBuild
                          ? (getAmuiUrl('upgrade') as any)
                          : (getLicenseDashboardUrl() as any);
                        // setIsUpgradeModalOpen(true);
                      }}
                    >
                      <span style={{ textDecoration: 'underline', color: '#D4B106' }}>Upgrade now</span>
                    </Button>
                  }
                  style={{ width: '75%' }}
                />
              )}
            </Col>
            {/* <Col xs={6}></Col> */}
            <Col xs={24} style={{ textAlign: 'right', width: '100%' }}>
              <Space
                direction="horizontal"
                size="large"
                align="end"
                wrap
                className="dashboard-page-row-space"
                style={{ width: '100%', justifyContent: 'flex-end' }}
              >
                {/* <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  style={{ borderRadius: '24px', width: '20rem' }}
                /> */}
                <Button type="primary" onClick={() => setIsAddNetworkModalOpen(true)}>
                  <GlobalOutlined /> Create Network
                </Button>
                <Button onClick={() => setIsNewHostModalOpen(true)}>
                  <PlusOutlined /> Add endpoint
                </Button>
                <span style={{ borderLeft: '1px solid #303030', height: '24px', margin: '0 4px' }} />
                <Button onClick={() => window.open(ExternalLinks.RAC_DOWNLOAD_LINK, '_blank')}>
                  <DesktopOutlined /> Desktop Client
                </Button>
                <Tooltip title="Docs">
                  <QuestionCircleOutlined
                    style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                    onClick={() => {
                      window.open('https://docs.netmaker.io', '_blank');
                    }}
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Layout.Header>
      </Row>
      <Row className="dashboard-page-row-2">
        <Col xs={24}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <h2 className="mb-2 text-xl font-bold">Introducing Guided Setup</h2>
              <p className="mb-3">
                Unveiling guided setup! This innovative functionality streamlines the setup process for your{' '}
                {branding.productName} network. Now you can effortlessly configure it for a multitude of other use
                cases.
              </p>
              <div>
                <Button type="primary" onClick={() => setIsQuickSetupModalOpen(true)}>
                  <ArrowRightOutlined />
                  Get Started
                </Button>
              </div>
            </Card>
            <div
              style={{
                width: '100%',
                height: '259px',
              }}
            >
              <Carousel adaptiveHeight={false} autoplay autoplaySpeed={10000}>
                <div>
                  <Card>
                    <h2 className="mb-2 text-xl font-bold">Start using {branding.productName}</h2>
                    <p className="mb-3">
                      {branding.productName} automates a secure superhighway between devices, clouds, virtual machines,
                      and servers using WireGuard®. It blows past any NAT’s, firewalls, or subnets that stand between
                      them to create a flat, simple network. The result is a secure overlay network that spans all your
                      devices, wherever they are. Of course, {branding.productName} does a lot more than that. With
                      ACL’s, Remote Access Gateway, Egress, and Relays, you have complete control of your network.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button type="primary" href="https://netmaker.io/demo-page" target="_blank" rel="noreferrer">
                        <ArrowRightOutlined />
                        Take the tutorial
                      </Button>
                    </div>
                  </Card>
                </div>
                <div>
                  <Card>
                    <h2 className="mb-2 text-xl font-bold">Remote Access</h2>
                    <p className="mb-3">
                      Remote Access Gateways enable secure access to your network via Clients. The Gateway forwards
                      traffic from the clients into the network, and from the network back to the clients. Clients are
                      simple WireGuard config files, supported on most devices. To use Clients, you must configure a
                      Remote Access Gateway, which is typically deployed in a public cloud environment, e.g. on a server
                      with a public IP, so that it is easily reachable from the Clients. Clients are configured on this
                      dashboard primary via client configs{' '}
                      <a
                        href="https://www.netmaker.io/features/remote-access-gateway"
                        target="_blank"
                        rel="noreferrer"
                        className="tutorial-banner-link"
                      >
                        (Learn More)
                      </a>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button type="primary" onClick={() => jumpToTourPage('remoteaccess')}>
                        <ArrowRightOutlined />
                        Take the tutorial
                      </Button>
                    </div>
                  </Card>
                </div>
                <div>
                  <Card>
                    <h2 className="mb-2 text-xl font-bold">Egress</h2>
                    <p className="mb-3">
                      Enable devices in your network to communicate with other devices outside the network via egress
                      gateways. An office network, home network, data center, or cloud region all become easily
                      accessible via the Egress Gateway. You can even set a machine as an Internet Gateway to create a
                      “traditional” VPN{' '}
                      <a
                        href="https://www.netmaker.io/features/egress"
                        target="_blank"
                        rel="noreferrer"
                        className="tutorial-banner-link"
                      >
                        {` `}(Learn more){` `}
                      </a>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button type="primary" onClick={() => jumpToTourPage('egress')}>
                        <ArrowRightOutlined />
                        Take the tutorial
                      </Button>
                    </div>
                  </Card>
                </div>
                <div>
                  <Card>
                    <h2 className="mb-2 text-xl font-bold">Relays</h2>
                    <p className="mb-3">
                      Enable devices in your network to communicate with otherwise unreachable devices with relays.{' '}
                      {branding.productName} uses Turn servers to automatically route traffic in these scenarios, but
                      sometimes, you’d rather specify which device should be routing the traffic
                      <a
                        href="https://www.netmaker.io/features/relay"
                        target="_blank"
                        rel="noreferrer"
                        className="tutorial-banner-link"
                      >
                        {` `}(Learn More) {` `}
                      </a>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button type="primary" onClick={() => jumpToTourPage('relays')}>
                        <ArrowRightOutlined />
                        Take the tutorial
                      </Button>
                    </div>
                  </Card>
                </div>
              </Carousel>
            </div>

            {store.networks.length === 0 && (
              <Card style={{ maxWidth: '30%' }}>
                <h3>Add a network</h3>
                <p>
                  Enable fast and secure connections between your devices. Create a network, and then add your hosts.
                </p>
                <div>
                  <Button type="primary" onClick={() => setIsAddNetworkModalOpen(true)}>
                    <PlusOutlined />
                    Get started with a network
                  </Button>
                </div>
              </Card>
            )}
            {store.hosts.length === 0 && (
              <Card style={{ maxWidth: '30%' }}>
                <h3>Add a host</h3>
                <p>
                  Start creating your network by adding controllable devices as “hosts” on your platform. Servers, VM’s,
                  your laptop, and more are all fair game.
                </p>
                <div>
                  <Button type="primary" onClick={() => setIsNewHostModalOpen(true)}>
                    <PlusOutlined />
                    Add a Host
                  </Button>
                </div>
              </Card>
            )}
            {store.networks.length > 0 && (
              <>
                <Row>
                  <Col xs={24}>
                    <Typography.Text
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                      }}
                    >
                      Networks
                    </Typography.Text>
                  </Col>
                </Row>

                <Row justify="space-between">
                  <Col xs={24} md={8}>
                    <Input
                      size="large"
                      placeholder="Search networks"
                      value={searchText}
                      onChange={(ev) => setSearchText(ev.target.value)}
                      prefix={<SearchOutlined />}
                    />
                  </Col>
                  <Col xs={24} md={16} style={{ textAlign: 'right' }} className="networks-table-button">
                    <Button size="large" style={{ marginRight: '0.5em' }} onClick={() => store.fetchNetworks()}>
                      <ReloadOutlined /> Reload Networks
                    </Button>
                    <Button type="primary" size="large" onClick={() => setIsAddNetworkModalOpen(true)}>
                      <PlusOutlined /> Create Network
                    </Button>
                  </Col>
                </Row>

                <Row justify="space-between">
                  <Col xs={24}>
                    <div className="table-wrapper">
                      <Table
                        columns={tableColumns}
                        dataSource={filteredNetworks}
                        rowKey="netid"
                        scroll={{ x: true }}
                        onRow={(network) => {
                          return {
                            onClick: () => {
                              navigate(getNetworkRoute(network));
                            },
                          };
                        }}
                      />
                    </div>
                  </Col>
                </Row>
              </>
            )}
          </Space>
        </Col>
      </Row>

      {/* misc */}
      <UpgradeModal isOpen={isUpgradeModalOpen} onCancel={() => setIsUpgradeModalOpen(false)} />
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={() => {
          setIsAddNetworkModalOpen(false);
          navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE));
        }}
        onCancel={() => setIsAddNetworkModalOpen(false)}
      />
      <NewHostModal
        isOpen={isNewHostModalOpen}
        onFinish={() => navigate(resolveAppRoute(AppRoutes.HOSTS_ROUTE))}
        onCancel={() => setIsNewHostModalOpen(false)}
      />
      <QuickSetupModal
        isModalOpen={isQuickSetupModalOpen}
        notify={notify}
        handleCancel={() => setIsQuickSetupModalOpen(false)}
        handleUpgrade={() => true}
        jumpToTourStep={jumpToTourPage}
      />
      {notifyCtx}
    </Layout.Content>
  );
}
