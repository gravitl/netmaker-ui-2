import UpdateHostModal from '@/components/modals/update-host-modal/UpdateHostModal';
import { Host } from '@/models/Host';
import { Interface } from '@/models/Interface';
import { AppRoutes } from '@/routes';
import { HostsService } from '@/services/HostsService';
import { useStore } from '@/store/store';
import { getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { ExclamationCircleFilled, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
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
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageProps } from '../../models/Page';
import './HostDetailsPage.scss';
import { resolveAppRoute, useQuery } from '@/utils/RouteUtils';
import NodeStatus from '@/components/ui/Status';

export default function HostDetailsPage(props: PageProps) {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const queryParams = useQuery();

  const storeUpdateHost = store.updateHost;
  const storeDeleteHost = store.deleteHost;
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [host, setHost] = useState<Host | null>(null);
  const [searchText, setSearchText] = useState('');

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

  const onUpdateHost = useCallback(() => {
    setIsEditingHost(false);
  }, []);

  const getHostHealth = useCallback(() => {
    const nodeHealths = store.nodes
      .filter((n) => n.hostid === host?.id)
      .map((n) => getNodeConnectivityStatus(n))
      .map((h) => {
        switch (h) {
          case 'healthy':
            return 3;
          case 'warning':
            return 2;
          case 'error':
            return 1;
          default:
            return 0;
        }
      })
      .filter((h) => h !== 0);

    let worstHealth = Number.MAX_SAFE_INTEGER;
    nodeHealths.forEach((h) => {
      worstHealth = Math.min(worstHealth, h);
    });

    switch (worstHealth) {
      default:
        return <NodeStatus nodeHealth="unknown" />;
      case 1:
        return <NodeStatus nodeHealth="error" />;
      case 2:
        return <NodeStatus nodeHealth="warning" />;
      case 3:
        return <NodeStatus nodeHealth="healthy" />;
    }
  }, [host?.id, store.nodes]);

  const loadHost = useCallback(() => {
    setIsLoading(true);
    if (!hostId) {
      navigate(resolveAppRoute(AppRoutes.HOSTS_ROUTE));
    }
    // load from store
    const host = store.hosts.find((h) => h.id === hostId);
    if (!host) {
      notify.error({ message: `Device ${hostId} not found` });
      navigate(resolveAppRoute(AppRoutes.HOSTS_ROUTE));
      return;
    }
    setHost(host);

    setIsLoading(false);
  }, [hostId, store.hosts, navigate, notify]);

  const onHostDelete = useCallback(async () => {
    try {
      if (!hostId) {
        throw new Error('Device not found');
      }
      await HostsService.deleteHost(hostId, true);
      notify.success({ message: `Device ${host?.name} deleted` });
      storeDeleteHost(hostId);
      navigate(resolveAppRoute(AppRoutes.HOSTS_ROUTE));
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to delete device',
          description: extractErrorMsg(err),
        });
      } else {
        notify.error({
          message: err instanceof Error ? err.message : 'Failed to delete device',
        });
      }
    }
  }, [hostId, notify, host?.name, storeDeleteHost, navigate]);

  const promptConfirmDelete = () => {
    if (!host) return;
    const assocNodes = store.nodes.filter((node) => node.hostid === host.id);

    Modal.confirm({
      title: `Do you want to delete device ${host?.name}?`,
      icon: <ExclamationCircleFilled />,
      content: (
        <>
          <Row>
            {assocNodes.length > 0 && (
              <Col xs={24}>
                <Typography.Text color="warning">Device will be removed from the following networks:</Typography.Text>
                <ul>
                  {assocNodes.map((node) => (
                    <li key={node.id}>{node.network}</li>
                  ))}
                </ul>
              </Col>
            )}
          </Row>
        </>
      ),
      onOk() {
        onHostDelete();
      },
    });
  };

  const confirmToggleHostDefaultness = useCallback(async () => {
    if (!host) return;
    Modal.confirm({
      title: 'Toggle defaultness',
      content: `Are you sure you want to turn ${!host.isdefault ? 'on' : 'off'} defaultness for this device?`,
      onOk: async () => {
        try {
          const newHost = (await HostsService.updateHost(host.id, { ...host, isdefault: !host.isdefault })).data;
          notify.success({ message: `Device ${host.id} updated` });
          storeUpdateHost(host.id, newHost);
        } catch (err) {
          notify.error({
            message: 'Failed to update device',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [host, notify, storeUpdateHost]);

  const refreshHostKeys = useCallback(() => {
    if (!hostId) return;
    Modal.confirm({
      title: 'Refresh device keys',
      content: "Are you sure you want to refresh this device's keys?",
      onOk: async () => {
        try {
          await HostsService.refreshHostKeys(hostId);
          notify.success({
            message: 'Device keys refreshing...',
            description: 'Device key pairs are refreshing. This may take a while.',
          });
        } catch (err) {
          notify.error({
            message: 'Failed to refresh device keys',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [notify, hostId]);

  const requestHostPull = useCallback(() => {
    if (!hostId) return;
    Modal.confirm({
      title: 'Synchronise device',
      content: `This will trigger this device to pull latest network(s) state from the server. Proceed?`,
      onOk: async () => {
        try {
          await HostsService.requestHostPull(hostId);
          notify.success({
            message: 'Device is syncing...',
            description: `Device pull has been initiated. This may take a while.`,
          });
        } catch (err) {
          notify.error({
            message: 'Failed to synchronise device',
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
        <Card style={{ width: '50%' }}>
          <Typography.Title level={5} style={{ marginTop: '0rem' }}>
            Device details
          </Typography.Title>

          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_id"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                ID
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.id}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_endpoint"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Endpoint (IPv4)
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.endpointip}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_endpointv6"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Endpoint (IPv6)
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.endpointipv6}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_isstaticendpoint"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Static Endpoint
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.isstatic ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_listenport"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Listen Port
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.listenport}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_isstaticport"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Static Port
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.isstaticport ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_macaddress"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                MAC Address
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.macaddress}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_mtu"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                MTU
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.mtu}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_persistentkeepalive"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Persistent Keepalive
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host?.persistentkeepalive ?? ''}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_publickey"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Public Key
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.publickey}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_os"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Operating System
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.os}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_version"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Version
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.version}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_verbosity"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Verbosity
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.verbosity}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_defaultinterface"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Default Interface
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.defaultinterface}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_isdefault"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Default Device
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.isdefault ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_debug"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Debug
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.debug ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
          <Row
            style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}
            data-nmui-intercom="host-details_autoupdate"
          >
            <Col xs={12}>
              <Typography.Text disabled style={{ color: '#A6A6A6' }}>
                Auto Update
              </Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.autoupdate ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
        </Card>

        {/* <Card style={{ width: '50%', marginTop: '2rem' }}>
          <Typography.Title level={5} style={{ marginTop: '0rem' }}>
            Advanced settings
          </Typography.Title>
        </Card> */}
      </div>
    );
  }, [host, themeToken.colorBorder]);

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
            <div className="table-wrapper">
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
            </div>
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
    loadHost();
  }, [loadHost]);

  // run only once
  useEffect(() => {
    const shouldEdit = queryParams.get('edit');
    if (shouldEdit === 'true') {
      setIsEditingHost(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout.Content
      className="HostDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding">
          <Col xs={24}>
            <Link to={resolveAppRoute(AppRoutes.HOSTS_ROUTE)}>View All Devices</Link>
            <Row>
              <Col xs={18}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  {host?.name ?? '...'}
                  <Typography.Text style={{ marginLeft: '1rem' }}>{getHostHealth()}</Typography.Text>
                </Typography.Title>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                <Dropdown
                  placement="bottomRight"
                  menu={{
                    items: [
                      {
                        key: 'default',
                        label: (
                          <Typography.Text
                            onClick={(ev) => {
                              ev.stopPropagation();
                              confirmToggleHostDefaultness();
                            }}
                          >
                            {host?.isdefault ? 'Unmake default' : 'Make default'}
                          </Typography.Text>
                        ),
                      },
                      {
                        key: 'sync',
                        label: <Typography.Text>Sync</Typography.Text>,
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          requestHostPull();
                        },
                      },
                      {
                        key: 'refresh-key',
                        label: <Typography.Text>Refresh Key</Typography.Text>,
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          refreshHostKeys();
                        },
                      },
                      {
                        key: 'edit',
                        label: <Typography.Text>Edit</Typography.Text>,
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          setIsEditingHost(true);
                        },
                      },
                      {
                        key: 'delete',
                        label: <Typography.Text type="danger">Delete</Typography.Text>,
                        onClick: (ev) => {
                          ev.domEvent.stopPropagation();
                          promptConfirmDelete();
                        },
                      },
                    ],
                  }}
                >
                  <Button type="default" style={{ marginRight: '.5rem' }}>
                    <SettingOutlined /> Device Settings
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
      {!!host && (
        <UpdateHostModal
          key={host.id}
          isOpen={isEditingHost}
          host={host}
          onCancel={() => {
            setIsEditingHost(false);
          }}
          onUpdateHost={onUpdateHost}
        />
      )}
    </Layout.Content>
  );
}
