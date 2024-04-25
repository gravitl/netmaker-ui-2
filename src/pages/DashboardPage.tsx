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
  Tooltip,
  Typography,
  notification,
} from 'antd';
import {
  ArrowRightOutlined,
  DownOutlined,
  GlobalOutlined,
  LaptopOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import UpgradeModal from '../components/modals/upgrade-modal/UpgradeModal';
import { PageProps } from '../models/Page';
import { AppRoutes } from '../routes';
import { useNavigate } from 'react-router-dom';
import AddNetworkModal from '@/components/modals/add-network-modal/AddNetworkModal';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import { getAmuiUrl, getLicenseDashboardUrl, resolveAppRoute } from '@/utils/RouteUtils';
import NewHostModal from '@/components/modals/new-host-modal/NewHostModal';
import { isSaasBuild } from '@/services/BaseService';
import { useBranding } from '@/utils/Utils';
import QuickSetupModal from '@/components/modals/quick-setup-modal/QuickSetupModal';

export type TourType = 'relays' | 'egress' | 'remoteaccess' | 'networks' | 'hosts';

export default function DashboardPage(props: PageProps) {
  const navigate = useNavigate();
  const store = useStore();
  const branding = useBranding();

  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNewHostModalOpen, setIsNewHostModalOpen] = useState(false);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  const [isQuickSetupModalOpen, setIsQuickSetupModalOpen] = useState(false);
  const [notify, notifyCtx] = notification.useNotification();

  const jumpToTourPage = (tourType: TourType) => {
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
    }
  };

  useEffect(() => {
    if (!isServerEE && !store.serverStatus.status?.is_on_trial_license) {
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
            <Col xs={24} lg={15} xl={12} style={{ textAlign: 'right' }}>
              <Space direction="horizontal" size="large" align="end" wrap className="dashboard-page-row-space">
                <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  style={{ borderRadius: '24px', width: '20rem' }}
                />
                <Dropdown.Button
                  style={{ marginTop: '-3rem', height: '100%' }}
                  type="primary"
                  menu={{
                    items: [
                      {
                        key: 'host',
                        label: (
                          <>
                            <LaptopOutlined /> <Typography.Text>Connect new Host</Typography.Text>
                          </>
                        ),
                        onClick: () => {
                          // navigate(getNewHostRoute(AppRoutes.HOSTS_ROUTE));
                          setIsNewHostModalOpen(true);
                        },
                      },
                    ],
                  }}
                  placement="bottomRight"
                  icon={<DownOutlined />}
                  onClick={() => setIsAddNetworkModalOpen(true)}
                >
                  <GlobalOutlined /> Create
                </Dropdown.Button>
                <Tooltip title="Docs">
                  <QuestionCircleOutlined
                    style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                    onClick={() => {
                      window.open('https://docs.netmaker.io', '_blank');
                    }}
                  />
                </Tooltip>
                {/* <Tooltip title="Notifications">
                  <BellOutlined
                    style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                    onClick={() => {
                      // TODO: notifications
                    }}
                  />
                </Tooltip> */}
              </Space>
            </Col>
          </Row>
        </Layout.Header>
      </Row>
      <Row className="dashboard-page-row-2">
        <Col xs={24}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card>
              <h3>Introducing Guided Setup</h3>
              <p>
                Unveiling guided setup! This innovative functionality streamlines the setup process for your{' '}
                {branding.productName} network. Now you can effortlessly configure it for a multitude of other use
                cases.
              </p>
              <div>
                <Button type="link" onClick={() => setIsQuickSetupModalOpen(true)}>
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
                  <Card
                    style={{
                      height: '259px',
                      background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
                    }}
                  >
                    <h3>Start using {branding.productName}</h3>
                    <p>
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
                  <Card
                    style={{
                      height: '259px',
                      background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
                    }}
                  >
                    <h3>Remote Access</h3>
                    <p>
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
                  <Card
                    style={{
                      height: '259px',
                      background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
                    }}
                  >
                    <h3>Egress</h3>
                    <p>
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
                  <Card
                    style={{
                      background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
                      height: '259px',
                    }}
                  >
                    <h3>Relays</h3>
                    <p>
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
      />
      {notifyCtx}
    </Layout.Content>
  );
}
