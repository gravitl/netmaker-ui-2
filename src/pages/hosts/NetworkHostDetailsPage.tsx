import { Host } from '@/models/Host';
import { Interface } from '@/models/Interface';
import { AppRoutes } from '@/routes';
import { HostsService } from '@/services/HostsService';
import { useStore } from '@/store/store';
import { getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { ExclamationCircleFilled, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Dropdown,
  Form,
  Input,
  Layout,
  Modal,
  notification,
  Row,
  Skeleton,
  Table,
  TableColumnsType,
  Tabs,
  TabsProps,
  Tag,
  theme,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageProps } from '../../models/Page';
import './NetworkHostDetailsPage.scss';
import { getHostRoute, getNetworkRoute, resolveAppRoute, useQuery } from '@/utils/RouteUtils';
import { Node } from '@/models/Node';
import { NodeConnectivityStatus } from '@/models/NodeConnectivityStatus';
import { DATE_TIME_FORMAT } from '@/constants/AppConstants';
import UpdateNodeModal from '@/components/modals/update-node-modal/UpdateNodeModal';
import { NodesService } from '@/services/NodesService';
import dayjs from 'dayjs';

export default function NetworkHostDetailsPage(props: PageProps) {
  const { hostId, networkId } = useParams<{ hostId: string; networkId: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const queryParams = useQuery();

  const storeDeleteNode = store.deleteNode;
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [host, setHost] = useState<Host | null>(null);
  const [node, setNode] = useState<Node | null>(null);
  const [searchText, setSearchText] = useState('');

  const network = store.networks.find((n) => n.netid === networkId);

  const interfacesTableCols: TableColumnsType<Interface> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name) => {
          return (
            <Typography.Text>
              {name} {name === host?.defaultinterface ? <Tag>Default</Tag> : <></>}
            </Typography.Text>
          );
        },
      },
      {
        title: 'IP Address',
        dataIndex: 'addressString',
      },
    ],
    [host?.defaultinterface],
  );

  const onUpdateNode = useCallback(() => {
    setIsEditingNode(false);
  }, []);

  const getHostHealth = useCallback(() => {
    const nodeHealth: NodeConnectivityStatus = node ? getNodeConnectivityStatus(node) : 'unknown';

    switch (nodeHealth) {
      default:
        return <Tag>&#9679; Unknown</Tag>;
      case 'error':
        return <Tag color="error">&#9679; Error</Tag>;
      case 'warning':
        return <Tag color="warning">&#9679; Warning</Tag>;
      case 'healthy':
        return <Tag color="success">&#9679; Healthy</Tag>;
    }
  }, [node]);

  const loadDetails = useCallback(() => {
    setIsLoading(true);
    if (!networkId) {
      navigate(resolveAppRoute(AppRoutes.NETWORKS_ROUTE));
      return;
    }
    if (!hostId) {
      navigate(getNetworkRoute(networkId));
      return;
    }
    // load from store
    const host = store.hosts.find((h) => h.id === hostId);
    const node = store.nodes.find((n) => n.network === networkId && n.hostid === hostId);
    if (!host || !node) {
      notify.error({ message: `Host ${hostId} not found` });
      navigate(getNetworkRoute(networkId));
      return;
    }
    setHost(host);
    setNode(node);

    setIsLoading(false);
  }, [networkId, hostId, store.hosts, store.nodes, navigate, notify]);

  const onHostRemove = useCallback(
    async (forceDelete: boolean) => {
      try {
        if (!hostId || !node || !networkId) {
          throw new Error('Host or network not found');
        }
        await NodesService.deleteNode(node?.id, networkId, forceDelete);
        if (forceDelete) {
          storeDeleteNode(node.id);
        }
        notify.success({ message: `Host ${hostId} deleted` });
        navigate(getNetworkRoute(networkId));
      } catch (err) {
        notify.error({
          message: 'Failed to delete host from network',
          description: extractErrorMsg(err as any),
        });
      }
    },
    [hostId, node, networkId, notify, storeDeleteNode, navigate],
  );

  const onHostToggleConnectivity = useCallback(
    async (newStatus: boolean) => {
      try {
        if (!hostId || !node || !networkId) {
          throw new Error('Host or network not found');
        }
        const updatedNode = (await NodesService.updateNode(node.id, networkId, { ...node, connected: newStatus })).data;
        store.updateNode(node.id, updatedNode);
        notify.success({
          message: `Successfully ${newStatus ? 'connected' : 'disconnected'}`,
          description: `Host is now ${newStatus ? 'connected to' : 'disconnected from'} network ${networkId}.`,
        });
      } catch (err) {
        notify.error({
          message: `Failed to ${newStatus ? 'connect' : 'disconnect'} host ${newStatus ? 'to' : 'from'} network`,
          description: extractErrorMsg(err as any),
        });
      }
    },
    [hostId, node, networkId, notify, store],
  );

  const promptConfirmDisconnect = () => {
    Modal.confirm({
      title: `Do you want to ${node?.connected ? 'disconnect' : 'connect'} host ${host?.name} ${
        node?.connected ? 'from' : 'to'
      } network ${networkId}?`,
      icon: <ExclamationCircleFilled />,
      onOk() {
        onHostToggleConnectivity(!node?.connected);
      },
    });
  };

  const promptConfirmRemove = () => {
    let forceDelete = false;

    Modal.confirm({
      title: `Do you want to remove host ${host?.name} from network ${networkId}?`,
      content: (
        <>
          <Row>
            <Col xs={24}>
              <Form.Item
                htmlFor="force-delete"
                label="Force delete"
                valuePropName="checked"
                style={{ marginBottom: '0px' }}
              >
                <Checkbox
                  id="force-delete"
                  onChange={(e) => {
                    forceDelete = e.target.checked;
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
      icon: <ExclamationCircleFilled />,
      onOk() {
        onHostRemove(forceDelete);
      },
    });
  };

  const refreshHostKeys = useCallback(() => {
    if (!hostId) return;
    Modal.confirm({
      title: 'Refresh host keys',
      content: "Are you sure you want to refresh this host's keys?",
      onOk: async () => {
        try {
          await HostsService.refreshHostKeys(hostId);
          notify.success({
            message: 'Host keys refreshing...',
            description: 'Host key pairs are refreshing. This may take a while.',
          });
        } catch (err) {
          notify.error({
            message: 'Failed to refresh host keys',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [notify, hostId]);

  const getOverviewContent = useCallback(() => {
    if (!host) return <Skeleton active />;
    return (
      <div
        className=""
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexFlow: 'column nowrap',
          // backgroundColor: 'black',
        }}
      >
        <Card style={{ width: '50%', marginTop: '2rem' }}>
          <Typography.Title level={5} style={{ marginTop: '0rem' }}>
            Network settings
          </Typography.Title>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_network"
          >
            <Col xs={12}>
              <Typography.Text disabled>Network</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{node?.network ?? ''}</Typography.Text>
            </Col>
          </Row>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_address"
          >
            <Col xs={12}>
              <Typography.Text disabled>IP Address (IPv4)</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{node?.address ?? ''}</Typography.Text>
            </Col>
          </Row>

          {network && network.isipv6 && (
            <Row
              style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
              data-nmui-intercom="network-host-details_address6"
            >
              <Col xs={12}>
                <Typography.Text disabled>IP Address (IPv6)</Typography.Text>
              </Col>
              <Col xs={12}>
                <Typography.Text>{node?.address6 ?? ''}</Typography.Text>
              </Col>
            </Row>
          )}

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_localaddress"
          >
            <Col xs={12}>
              <Typography.Text disabled>Local Address</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{node?.localaddress ?? ''}</Typography.Text>
            </Col>
          </Row>

          {node?.isegressgateway && (
            <Row
              style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
              data-nmui-intercom="network-host-details_egressgatewayranges"
            >
              <Col xs={12}>
                <Typography.Text disabled>Egress Gateway Ranges</Typography.Text>
              </Col>
              <Col xs={12}>
                <Typography.Text>{node?.egressgatewayranges?.join(', ') ?? ''}</Typography.Text>
              </Col>
            </Row>
          )}

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_connected"
          >
            <Col xs={12}>
              <Typography.Text disabled>Is Connected</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{node?.connected ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_defaultacl"
          >
            <Col xs={12}>
              <Typography.Text disabled>Default ACL</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{node?.defaultacl ?? ''}</Typography.Text>
            </Col>
          </Row>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_dnson"
          >
            <Col xs={12}>
              <Typography.Text disabled>DNS On</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{node?.dnson ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_lastcheckin"
          >
            <Col xs={12}>
              <Typography.Text disabled>Last Check-in Time</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{dayjs((node?.lastcheckin ?? 0) * 1000).format(DATE_TIME_FORMAT) ?? ''}</Typography.Text>
            </Col>
          </Row>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_expdatetime"
          >
            <Col xs={12}>
              <Typography.Text disabled>Expiration Date</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{dayjs((node?.expdatetime ?? 0) * 1000).format(DATE_TIME_FORMAT) ?? ''}</Typography.Text>
            </Col>
          </Row>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="network-host-details_lastmodified"
          >
            <Col xs={12}>
              <Typography.Text disabled>Last Modified Time</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>
                {dayjs((node?.lastmodified ?? 0) * 1000).format(DATE_TIME_FORMAT) ?? ''}
              </Typography.Text>
            </Col>
          </Row>
        </Card>

        <Card style={{ width: '50%', marginTop: '2rem' }}>
          <Collapse ghost size="small">
            <Collapse.Panel
              key="details"
              header={
                <Typography.Title level={5} style={{ marginTop: '0rem' }}>
                  Global Settings
                </Typography.Title>
              }
            >
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostid"
              >
                <Col xs={12}>
                  <Typography.Text disabled>ID</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.id}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostendpoint"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Endpoint</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.endpointip}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostlistenport"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Listen Port</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.listenport}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostmacaddress"
              >
                <Col xs={12}>
                  <Typography.Text disabled>MAC Address</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.macaddress}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostmtu"
              >
                <Col xs={12}>
                  <Typography.Text disabled>MTU</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.mtu}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostpersistentkeepalive"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Persistent Keepalive</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.persistentkeepalive}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostpublickey"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Public Key</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.publickey}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostos"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Operating System</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.os}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostversion"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Version</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.version}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostverbosity"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Verbosity</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.verbosity}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostdefaultinterface"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Default Interface</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.defaultinterface}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostisdefault"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Default Host</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.isdefault ? 'Yes' : 'No'}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostisstatic"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Static Endpoint</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.isstatic ? 'Yes' : 'No'}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_hostdebug"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Debug</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.debug ? 'Yes' : 'No'}</Typography.Text>
                </Col>
              </Row>
              <Row
                style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
                data-nmui-intercom="network-host-details_autoupdate"
              >
                <Col xs={12}>
                  <Typography.Text disabled>Auto Update</Typography.Text>
                </Col>
                <Col xs={12}>
                  <Typography.Text>{host.autoupdate ? 'Yes' : 'No'}</Typography.Text>
                </Col>
              </Row>
            </Collapse.Panel>
          </Collapse>
        </Card>
      </div>
    );
  }, [host, network, node, themeToken.colorBorder]);

  const getNetworkInterfacesContent = useCallback(() => {
    return (
      <>
        <Row>
          <Col xs={12} md={8}>
            <Input
              size="large"
              placeholder="Search interfaces"
              value={searchText}
              onChange={(ev) => setSearchText(ev.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: '1rem' }}>
          <Col xs={24}>
            <Table
              columns={interfacesTableCols}
              dataSource={
                host?.interfaces?.filter((iface) =>
                  `${iface.name}${iface.addressString}`
                    .toLocaleLowerCase()
                    .includes(searchText.toLocaleLowerCase().trim()),
                ) ?? []
              }
              rowKey={(iface) => `${iface.name}${iface.addressString}`}
            />
          </Col>
        </Row>
      </>
    );
  }, [host?.interfaces, interfacesTableCols, searchText]);

  const hostTabs: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'overview',
        label: `Overview`,
        children: host ? getOverviewContent() : <Skeleton active />,
      },
      {
        key: 'network-interface',
        label: `Network Interfaces`,
        children: host ? getNetworkInterfacesContent() : <Skeleton active />,
      },
    ];
  }, [getNetworkInterfacesContent, getOverviewContent, host]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // run only once
  useEffect(() => {
    const shouldEdit = queryParams.get('edit');
    if (shouldEdit === 'true') {
      setIsEditingNode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout.Content
      className="NetworkHostDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding">
          <Col xs={24}>
            <Link to={getNetworkRoute(networkId || '')}>View Network</Link>
            <Row>
              <Col xs={18}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  {host?.name ?? '...'}
                  {node?.pendingdelete === false && <span style={{ marginLeft: '1rem' }}>{getHostHealth()}</span>}
                  {node?.pendingdelete !== false && (
                    <span style={{ marginLeft: '1rem' }}>
                      <Badge status="processing" color="red" text="Removing..." />
                    </span>
                  )}
                </Typography.Title>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                <Dropdown
                  placement="bottomRight"
                  menu={{
                    items: [
                      {
                        key: 'refresh-key',
                        label: 'Refresh Key',
                        disabled: node?.pendingdelete !== false,
                        title: node?.pendingdelete !== false ? 'Host is being removed from network' : '',
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          refreshHostKeys();
                        },
                      },
                      {
                        key: 'edit',
                        label: 'Edit',
                        disabled: node?.pendingdelete !== false,
                        title: node?.pendingdelete !== false ? 'Host is being removed from network' : '',
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          setIsEditingNode(true);
                        },
                      },
                      {
                        key: 'global-hpst',
                        label: 'View Global Host',
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          navigate(getHostRoute(hostId ?? ''));
                        },
                      },
                      {
                        key: 'disconnect',
                        label: (
                          <Typography.Text type="warning">
                            {node?.connected ? 'Disconnect from' : 'Connect to'} network
                          </Typography.Text>
                        ),
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          promptConfirmDisconnect();
                        },
                      },
                      {
                        key: 'remove',
                        label: <Typography.Text type="danger">Remove from network</Typography.Text>,
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          promptConfirmRemove();
                        },
                      },
                    ],
                  }}
                >
                  <Button type="default" style={{ marginRight: '.5rem' }}>
                    <SettingOutlined /> Host Settings
                  </Button>
                </Dropdown>
              </Col>
            </Row>

            <Tabs items={hostTabs} />
          </Col>
        </Row>
      </Skeleton>

      {/* misc */}
      {notifyCtx}
      {!!node && (
        <UpdateNodeModal
          isOpen={isEditingNode}
          node={node}
          onCancel={() => {
            setIsEditingNode(false);
          }}
          onUpdateNode={onUpdateNode}
        />
      )}
    </Layout.Content>
  );
}
