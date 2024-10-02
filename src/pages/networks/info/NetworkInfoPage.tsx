import AddDnsModal from '@/components/modals/add-dns-modal/AddDnsModal';
import AddRelayModal from '@/components/modals/add-relay-modal/AddRelayModal';
import UpdateRelayModal from '@/components/modals/update-relay-modal/UpdateRelayModal';
import NetworkGraph from '@/components/NetworkGraph';
import { NETWORK_GRAPH_SIGMA_CONTAINER_ID } from '@/constants/AppConstants';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { NULL_HOST, NULL_NODE } from '@/constants/Types';
import { NodeAclContainer } from '@/models/Acl';
import { DNS } from '@/models/Dns';
import { ExternalClient } from '@/models/ExternalClient';
import { Host } from '@/models/Host';
import { MetricCategories, NetworkMetrics, NodeOrClientMetric, UptimeNodeMetrics } from '@/models/Metrics';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { isSaasBuild } from '@/services/BaseService';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { renderMetricValue, useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DashOutlined,
} from '@ant-design/icons';
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl, SearchControl } from '@react-sigma/core';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  MenuProps,
  Modal,
  notification,
  Radio,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  TableColumnProps,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import form from 'antd/es/form';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import getNodeImageProgram from 'sigma/rendering/webgl/programs/node.image';

interface NetworkInfoPageProps {
  networkId?: string;
  isFullScreen: boolean;
}

export default function NetworkInfoPage({ isFullScreen }: NetworkInfoPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();

  const [form] = Form.useForm<Network>();
  const isIpv4Watch = Form.useWatch('isipv4', form);
  const isIpv6Watch = Form.useWatch('isipv6', form);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isEditingNetwork, setIsEditingNetwork] = useState(false);

  const networkNodes = useMemo(
    () =>
      store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .filter((node) => node.network === resolvedNetworkId),
    [store.nodes, store.hostsCommonDetails, resolvedNetworkId],
  );

  const networkHosts = useMemo(() => {
    const hostsMap = new Map<Host['id'], Host>();
    store.hosts.forEach((host) => {
      hostsMap.set(host.id, host);
    });
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => hostsMap.get(node.hostid) ?? NULL_HOST);
  }, [networkId, store.hosts, store.nodes]);

  // useEffect(() => {
  //   if (isInitialLoad) {
  //     loadMetrics();
  //     setIsInitialLoad(false);
  //   }
  // }, [isInitialLoad, loadMetrics]);

  return (
    <div className="NetworkInfoPage" style={{ position: 'relative', height: '100%', padding: isFullScreen ? 0 : 24 }}>
      <div className={`${isFullScreen ? 'page-padding' : ''}`}>
        <Row style={{ marginBottom: '1rem', width: '100%' }}>
          <Col>
            <Typography.Title level={2}>Info</Typography.Title>
          </Col>
        </Row>
        <Row style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
          <Card className="overview-card">
            <Form
              name="network-details-form"
              form={form}
              layout="vertical"
              initialValues={network ?? undefined}
              disabled={!isEditingNetwork}
            >
              <Form.Item
                label="Network name"
                name="netid"
                rules={[{ required: true }]}
                data-nmui-intercom="network-details-form_netid"
              >
                <Input placeholder="Network name" disabled={!isEditingNetwork} />
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
                      <Form.Item
                        name="isipv4"
                        valuePropName="checked"
                        style={{ marginBottom: '0px' }}
                        data-nmui-intercom="network-details-form_isipv4"
                      >
                        <Switch disabled={!isEditingNetwork} />
                      </Form.Item>
                    </Col>
                  </Row>
                  {isIpv4Watch && (
                    <Row>
                      <Col xs={24}>
                        <Form.Item
                          name="addressrange"
                          style={{ marginBottom: '0px' }}
                          data-nmui-intercom="network-details-form_addressrange"
                        >
                          <Input placeholder="Enter address CIDR (eg: 192.168.1.0/24)" disabled={!isEditingNetwork} />
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
                      <Form.Item
                        name="isipv6"
                        valuePropName="checked"
                        style={{ marginBottom: '0px' }}
                        data-nmui-intercom="network-details-form_isipv6"
                      >
                        <Switch disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                  {isIpv6Watch && (
                    <Row>
                      <Col xs={24}>
                        <Form.Item
                          name="addressrange6"
                          style={{ marginBottom: '0px' }}
                          data-nmui-intercom="network-details-form_addressrange6"
                        >
                          <Input
                            placeholder="Enter address CIDR (eg: 2002::1234:abcd:ffff:c0a8:101/64)"
                            disabled={!isEditingNetwork}
                          />
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
                      <Form.Item
                        name="defaultacl"
                        style={{ marginBottom: '0px' }}
                        rules={[{ required: true }]}
                        data-nmui-intercom="network-details-form_defaultacl"
                      >
                        <Select
                          size="small"
                          style={{ width: '100%' }}
                          options={[
                            { label: 'ALLOW', value: 'yes' },
                            { label: 'DENY', value: 'no' },
                          ]}
                          disabled
                        ></Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
              {/* TODO: Bring back if needed */}
              {/* <Row
              style={{
                border: `1px solid ${themeToken.colorBorder}`,
                borderRadius: '8px',
                padding: '.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <Col xs={24}>
                <Row justify="space-between" align="middle">
                  {!usecase && (
                    <Alert
                      message="Your network is missing a usecase, please add one or if you know your way around you can ignore"
                      type="warning"
                      showIcon
                      style={{ marginBottom: '1rem' }}
                    />
                  )}
                  <Col>Primary usecase for network</Col>
                  <Col md={8}>
                    <Form.Item
                      name="defaultUsecase"
                      style={{ marginBottom: '0px' }}
                      rules={[{ required: false }]}
                      data-nmui-intercom="add-network-form_usecase"
                      initialValue={usecase}
                    >
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        options={Object.keys(networkUsecaseMapText).map((key) => {
                          return { label: networkUsecaseMapText[key as NetworkUsecaseString], value: key };
                        })}
                        onChange={onUpdateUsecase}
                      ></Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row> */}
            </Form>
          </Card>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
    </div>
  );
}
