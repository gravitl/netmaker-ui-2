import UpdateHostModal from '@/components/modals/update-host-modal/UpdateHostModal';
import { Host } from '@/models/Host';
import { Interface } from '@/models/Interface';
import { AppRoutes } from '@/routes';
import { HostsService } from '@/services/HostsService';
import { useStore } from '@/store/store';
import { getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { ExclamationCircleFilled, SettingOutlined } from '@ant-design/icons';
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
import { useQuery } from '@/utils/RouteUtils';

export default function HostDetailsPage(props: PageProps) {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const queryParams = useQuery();

  const storeUpdateHost = store.updateHost;
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
    [host?.defaultinterface]
  );

  const onUpdateHost = useCallback(() => {
    setIsEditingHost(false);
  }, []);

  // const toggleProxyStatus = useCallback(
  //   (newStatus: boolean) => {
  //     Modal.confirm({
  //       title: 'Toggle proxy status',
  //       content: `Are you sure you want to turn ${newStatus ? 'on' : 'off'} proxy for this host?`,
  //       onOk: async () => {
  //         try {
  //           if (!hostId || !host) return;
  //           const newHost = (await HostsService.updateHost(hostId, { ...host, proxy_enabled: newStatus })).data;
  //           storeUpdateHost(hostId, newHost);
  //         } catch (err) {
  //           notify.error({
  //             message: 'Failed to update host',
  //             description: extractErrorMsg(err as any),
  //           });
  //         }
  //       },
  //     });
  //   },
  //   [hostId, host, storeUpdateHost, notify]
  // );

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
        return <Tag>&#9679; Unknown</Tag>;
      case 1:
        return <Tag color="error">&#9679; Error</Tag>;
      case 2:
        return <Tag color="warning">&#9679; Warning</Tag>;
      case 3:
        return <Tag color="success">&#9679; Healthy</Tag>;
    }
  }, [host?.id, store.nodes]);

  const loadHost = useCallback(() => {
    setIsLoading(true);
    if (!hostId) {
      navigate(AppRoutes.HOSTS_ROUTE);
    }
    // load from store
    const host = store.hosts.find((h) => h.id === hostId);
    if (!host) {
      notify.error({ message: `Host ${hostId} not found` });
      navigate(AppRoutes.HOSTS_ROUTE);
      return;
    }
    setHost(host);

    setIsLoading(false);
  }, [hostId, store.hosts, navigate, notify]);

  const onHostDelete = useCallback(async () => {
    try {
      if (!hostId) {
        throw new Error('Host not found');
      }
      await HostsService.deleteHost(hostId);
      notify.success({ message: `Host ${hostId} deleted` });
      store.deleteNetwork(hostId);
      navigate(AppRoutes.HOSTS_ROUTE);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to delete host',
          description: extractErrorMsg(err),
        });
      } else {
        notify.error({
          message: err instanceof Error ? err.message : 'Failed to delete host',
        });
      }
    }
  }, [hostId, notify, navigate, store]);

  const promptConfirmDelete = () => {
    Modal.confirm({
      title: `Do you want to delete host ${host?.name}?`,
      icon: <ExclamationCircleFilled />,
      onOk() {
        onHostDelete();
      },
    });
  };

  const confirmToggleHostDefaultness = useCallback(async () => {
    if (!host) return;
    Modal.confirm({
      title: 'Toggle defaultness',
      content: `Are you sure you want to turn ${!host.isdefault ? 'on' : 'off'} defaultness for this host?`,
      onOk: async () => {
        try {
          const newHost = (await HostsService.updateHost(host.id, { ...host, isdefault: !host.isdefault })).data;
          notify.success({ message: `Host ${host.id} updated` });
          storeUpdateHost(host.id, newHost);
        } catch (err) {
          notify.error({
            message: 'Failed to update host',
            description: extractErrorMsg(err as any),
          });
        }
      },
    });
  }, [host, notify, storeUpdateHost]);

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
        <Card style={{ width: '50%' }}>
          <Typography.Title level={5} style={{ marginTop: '0rem' }}>
            Host details
          </Typography.Title>

          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>ID</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.id}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Endpoint</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.endpointip}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Listen Port</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.listenport}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>MAC Address</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.macaddress}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>MTU</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.mtu}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Public Key</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.publickey}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Operating System</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.os}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Version</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.version}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Verbosity</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.verbosity}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Default Interface</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.defaultinterface}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Default Host</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.isdefault ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Static Endpoint</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.isstatic ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Debug</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.debug ? 'Yes' : 'No'}</Typography.Text>
            </Col>
          </Row>
        </Card>

        <Card style={{ width: '50%', marginTop: '2rem' }}>
          <Typography.Title level={5} style={{ marginTop: '0rem' }}>
            Advanced settings
          </Typography.Title>
          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Internet Gateway</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.internetgateway}</Typography.Text>
            </Col>
          </Row>

          <Row style={{ borderBottom: `1px solid ${themeToken.colorBorder}`, padding: '.5rem 0rem' }}>
            <Col xs={12}>
              <Typography.Text disabled>Proxy Listen Port</Typography.Text>
            </Col>
            <Col xs={12}>
              <Typography.Text>{host.listenport}</Typography.Text>
            </Col>
          </Row>
        </Card>
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
            />
          </Col>
        </Row>
        <Row style={{ marginTop: '1rem' }}>
          <Col xs={24}>
            <Table
              columns={interfacesTableCols}
              dataSource={
                host?.interfaces.filter((iface) =>
                  `${iface.name}${iface.addressString}`
                    .toLocaleLowerCase()
                    .includes(searchText.toLocaleLowerCase().trim())
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
            <Link to={AppRoutes.HOSTS_ROUTE}>View All Hosts</Link>
            <Row>
              <Col xs={18}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  {host?.name ?? '...'}
                  <span style={{ marginLeft: '1rem' }}>{getHostHealth()}</span>
                </Typography.Title>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                {/* <span style={{ marginRight: '2rem' }}>
                  <Typography.Text style={{ marginRight: '1rem' }}>Proxy Status</Typography.Text>
                  <Switch checked={host?.proxy_enabled} onChange={toggleProxyStatus} />
                </span> */}
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
