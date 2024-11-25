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
import { ExtendedNode } from '@/models/Node';
import { isSaasBuild } from '@/services/BaseService';
import { NetworksService } from '@/services/NetworksService';
import { NodesService } from '@/services/NodesService';
import { useStore } from '@/store/store';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import {
  SearchOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl, SearchControl } from '@react-sigma/core';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  MenuProps,
  Modal,
  notification,
  Row,
  Skeleton,
  Table,
  TableColumnProps,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import getNodeImageProgram from 'sigma/rendering/webgl/programs/node.image';

interface NetworkGraphPageProps {
  networkId?: string;
  isFullScreen: boolean;
}

export default function NetworkGraphPage({ isFullScreen }: NetworkGraphPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [originalAcls, setOriginalAcls] = useState<NodeAclContainer>({});
  const [clients, setClients] = useState<ExternalClient[]>([]);

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

  const loadAcls = useCallback(async () => {
    try {
      if (!networkId) return;
      const acls = (await NetworksService.getAcls(networkId)).data;
      setOriginalAcls(acls);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err instanceof AxiosError && err.response?.status === 403) return;
        notify.error({
          message: 'Error loading ACLs',
          description: extractErrorMsg(err),
        });
      }
    }
  }, [networkId, notify]);

  useEffect(() => {
    if (isInitialLoad) {
      loadAcls();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, loadAcls]);

  const containerHeight = '78vh';

  return (
    <div className="NetworkGraphPage" style={{ position: 'relative', height: '100%', padding: isFullScreen ? 0 : 24 }}>
      <Row style={{ width: '100%' }}>
        <Col xs={24} style={{ width: '100%', height: containerHeight }}>
          <Skeleton loading={isLoadingNetwork} active>
            {!!network && (
              <SigmaContainer
                id={NETWORK_GRAPH_SIGMA_CONTAINER_ID}
                settings={{
                  nodeProgramClasses: { image: getNodeImageProgram() },
                }}
                style={{
                  backgroundColor: themeToken.colorBgContainer,
                  position: 'relative',
                  height: '100%',
                }}
              >
                <NetworkGraph
                  network={network}
                  hosts={networkHosts}
                  nodes={networkNodes}
                  acl={originalAcls}
                  clients={clients}
                />
                <ControlsContainer position={'top-left'}>
                  <ZoomControl />
                  <FullScreenControl />
                </ControlsContainer>
                <ControlsContainer position={'top-left'} className="search-container">
                  <SearchControl />
                </ControlsContainer>
              </SigmaContainer>
            )}
            {!network && (
              <div className="flex items-center justify-center h-full">
                <Typography.Text type="secondary">Failed to load network. Please refresh</Typography.Text>
              </div>
            )}
          </Skeleton>
        </Col>
      </Row>

      {/* misc */}
      {notifyCtx}
    </div>
  );
}
