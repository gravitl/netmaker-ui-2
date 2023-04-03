import { Host } from '@/models/Host';
import { AppRoutes } from '@/routes';
import { HostsService } from '@/services/HostsService';
import { useStore } from '@/store/store';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { ExclamationCircleFilled } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Layout,
  Modal,
  notification,
  Row,
  Skeleton,
  Tabs,
  TabsProps,
  theme,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageProps } from '../../models/Page';

import './HostDetailsPage.scss';

export default function HostDetailsPage(props: PageProps) {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();

  const [isLoading, setIsLoading] = useState(false);
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [host, setHost] = useState<Host | null>(null);

  const onHostFormEdit = useCallback(() => {}, []);

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
      navigate(AppRoutes.NETWORKS_ROUTE);
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
    return <></>;
  }, []);

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

  return (
    <Layout.Content
      className="HostDetailsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoading} active className="page-padding">
        {/* top bar */}
        <Row className="tabbed-page-row-padding">
          <Col xs={24}>
            <Link to={AppRoutes.NETWORKS_ROUTE}>View All Hosts</Link>
            <Row>
              <Col xs={18}>
                <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                  {host?.name ?? '...'}
                </Typography.Title>
              </Col>
              <Col xs={6} style={{ textAlign: 'right' }}>
                {!isEditingHost && (
                  <Button type="default" style={{ marginRight: '.5rem' }} onClick={() => setIsEditingHost(true)}>
                    Edit
                  </Button>
                )}
                {isEditingHost && (
                  <>
                    <Button type="primary" style={{ marginRight: '.5rem' }} onClick={onHostFormEdit}>
                      Save Changes
                    </Button>
                    <Button
                      style={{ marginRight: '.5rem' }}
                      onClick={() => {
                        setIsEditingHost(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                <Button type="default" onClick={promptConfirmDelete}>
                  Delete
                </Button>
              </Col>
            </Row>

            <Tabs items={hostTabs} />
          </Col>
        </Row>
      </Skeleton>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
