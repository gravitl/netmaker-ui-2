import { Network } from '@/models/Network';
import { AppRoutes } from '@/routes';
import { InfoCircleOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  Layout,
  Modal,
  Row,
  Skeleton,
  Table,
  TableColumnsType,
  Tooltip,
  Tour,
  TourProps,
  Typography,
  notification,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddNetworkModal from '../../components/modals/add-network-modal/AddNetworkModal';
import { PageProps } from '../../models/Page';
import { useStore } from '../../store/store';
import './NetworksPage.scss';
import { getNetworkRoute, resolveAppRoute } from '@/utils/RouteUtils';
import { NetworksService } from '@/services/NetworksService';
import { extractErrorMsg } from '@/utils/ServiceUtils';

export default function NetworksPage(props: PageProps) {
  const store = useStore();
  const navigate = useNavigate();

  const networks = store.networks;
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const tableColumnsNameRow = useRef(null);
  const addNetworkButton = useRef(null);
  const autoFillButtonRef = useRef(null);
  const networkNameInputRef = useRef(null);
  const ipv4InputRef = useRef(null);
  const ipv6InputRef = useRef(null);
  const defaultAclInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [notify, notifyCtx] = notification.useNotification();

  const confirmNetworkDelete = useCallback((netId: string) => {
    Modal.confirm({
      title: `Are you sure you want to the delete the network ${netId}?`,
      content: `This action cannot be undone.`,
      onOk: async () => {
        try {
          const network = await NetworksService.deleteNetwork(netId);
          store.deleteNetwork(netId);
          notify.success({
            message: 'Network deleted',
            description: `Network ${netId} has been deleted`,
          });
        } catch (err) {
          notify.error({
            message: 'Failed to delete network',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, []);

  const checkIfNetworkDeleteIsPossible = useCallback(
    (netId: string) => {
      return store.nodes?.filter((node) => node.network === netId).length === 0;
    },
    [store.nodes],
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
        <Link to={`${resolveAppRoute(AppRoutes.NETWORKS_ROUTE)}/${encodeURIComponent(netId)}`}>{netId}</Link>
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
    {
      title: '',
      key: 'action',
      dataIndex: 'netid',
      render: (netId: string) => (
        <>
          <Tooltip
            title={
              checkIfNetworkDeleteIsPossible(netId)
                ? 'Delete Network'
                : "You can't delete this network yet. There are still devices linked to it. Please remove all devices from the network first."
            }
          >
            <Button
              danger
              onClick={(ev) => {
                ev.stopPropagation();
                confirmNetworkDelete(netId);
              }}
              disabled={!checkIfNetworkDeleteIsPossible(netId)}
            >
              Delete
            </Button>
          </Tooltip>
        </>
      ),
    },
  ];

  const filteredNetworks = useMemo(
    () =>
      networks.filter((network) => {
        return network.netid.toLowerCase().includes(searchText.toLowerCase());
      }),
    [networks, searchText],
  );

  const loadNetworks = useCallback(async () => {
    await store.fetchNetworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tourSteps: TourProps['steps'] = [
    {
      title: 'Network details',
      description:
        'Get network information like name, address range (IPv4), address range (IPv6), hosts count, network last modified, and hosts last modified.',
      target: () => tableColumnsNameRow.current,
    },
    {
      title: 'Add a network',
      description: 'Click here to add a network.',
      target: () => addNetworkButton.current,
    },
    {
      title: 'Autofill',
      description: 'Click here to autofill the network details.',
      target: () => autoFillButtonRef.current,
    },
    {
      title: 'Network name',
      description: 'Enter a name for the network.',
      target: () => networkNameInputRef.current,
    },
    {
      title: 'IPv4 address range',
      description: 'Enter an IPv4 address range.',
      target: () => ipv4InputRef.current,
    },
    {
      title: 'IPv6 address range',
      description: 'Enter an IPv6 address range.',
      target: () => ipv6InputRef.current,
    },
    {
      title: 'Default ACL',
      description: 'Select a default ACL.',
      target: () => defaultAclInputRef.current,
    },
    {
      title: 'Submit',
      description: 'Click here to submit the network details.',
      target: () => submitButtonRef.current,
    },
  ];

  const handleTourOnChange = (current: number) => {
    setTourStep(current);
    switch (current) {
      case 1:
        setIsAddNetworkModalOpen(false);
        break;
      case 2:
        setIsAddNetworkModalOpen(true);
        break;
      default:
        break;
    }
  };

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
              <Col xs={24} xl={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  Networks
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  A network is how your hosts and clients communicate. Each machine gets a private IP address within the
                  defined subnet and communicates securely with all the other devices in the network. The network is
                  your base layer. Once it&apos;s created you can add Remote Access Gateway, Egress, Relay, and more.
                  Create multiple networks and manage multiple secure domains for your devices!
                </Typography.Text>
              </Col>
              <Col xs={24} xl={(24 * 1) / 3} style={{ position: 'relative' }}>
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

            <Row className="card-con" gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Add a Network</Typography.Title>
              </Col>

              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
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
              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
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
              <Col xs={24} xl={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    After Creation
                  </Typography.Title>
                  <Typography.Text>
                    Add hosts to your network. Make a host into a{' '}
                    <a href="https://www.netmaker.io/features/ingress" target="_blank" rel="noreferrer">
                      remote access gateway
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
                <Button
                  size="large"
                  style={{ marginRight: '0.5em' }}
                  onClick={() => {
                    setIsAddNetworkModalOpen(false);
                    setIsTourOpen(true);
                    setTourStep(0);
                  }}
                >
                  <InfoCircleOutlined /> Start Tour
                </Button>
                <Button size="large" style={{ marginRight: '0.5em' }} onClick={() => loadNetworks()}>
                  <ReloadOutlined /> Reload Networks
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setIsAddNetworkModalOpen(true)}
                  ref={addNetworkButton}
                >
                  <PlusOutlined /> Create Network
                </Button>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
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
                    ref={tableColumnsNameRow}
                  />
                </div>
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* tour */}
      <Tour
        open={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        steps={tourSteps}
        onChange={handleTourOnChange}
        current={tourStep}
      />

      {/* modals */}
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={() => {
          setIsAddNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddNetworkModalOpen(false)}
        autoFillButtonRef={autoFillButtonRef}
        networkNameInputRef={networkNameInputRef}
        ipv4InputRef={ipv4InputRef}
        ipv6InputRef={ipv6InputRef}
        defaultAclInputRef={defaultAclInputRef}
        submitButtonRef={submitButtonRef}
      />

      {notifyCtx}
    </Layout.Content>
  );
}
