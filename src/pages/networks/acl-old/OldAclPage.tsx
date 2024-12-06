import {
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  DashOutlined,
} from '@ant-design/icons';
import { ComputerDesktopIcon, EllipsisHorizontalIcon, TagIcon, UserIcon, UsersIcon } from '@heroicons/react/24/solid';
import {
  Button,
  Dropdown,
  Input,
  Table,
  Tag,
  Tooltip,
  Switch,
  Modal,
  Col,
  Row,
  Typography,
  notification,
  theme,
  Alert,
  Badge,
  TableColumnProps,
} from 'antd';
import { NotificationInstance } from 'antd/es/notification/interface';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { ACLRule, DestinationTypeValue, SourceTypeValue } from '@/services/dtos/ACLDtos';
import { ACLService } from '@/services/ACLService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import arrowBidirectional from '../../../../public/arrow-bidirectional.svg';
import UpdateACLModal from '@/components/modals/update-acl-modal/UpdateACLModal';
import AddACLModal from '@/components/modals/add-acl-modal/AddACLModal';
import { UsersService } from '@/services/UsersService';
import { User, UserGroup } from '@/models/User';
import { useBranding, useGetActiveNetwork, useServerLicense } from '@/utils/Utils';
import { Tag as TagType } from '@/models/Tags';
import { TagsService } from '@/services/TagsService';
import { useStore } from '@/store/store';
import { useNavigate, useParams } from 'react-router-dom';
import VirtualisedTable from '@/components/VirtualisedTable';
import { NULL_HOST } from '@/constants/Types';
import { Host } from '@/models/Host';
import { NetworksService } from '@/services/NetworksService';
import { getExtendedNode } from '@/utils/NodeUtils';
import { ExternalClient } from '@/models/ExternalClient';
import { ACL_ALLOWED, ACL_DENIED, ACL_UNDEFINED, AclStatus, NodeAcl, NodeAclContainer } from '@/models/Acl';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { Node } from '@/models/Node';
import { getNetworkPageRoute } from '@/utils/RouteUtils';

interface NetworkOldAclPageProps {
  isFullScreen: boolean;
  networkId?: string;
}

interface AclTableData {
  type: 'node' | 'client';
  nodeOrClientId: Node['id'] | ExternalClient['clientid'];
  name: Host['name'] | ExternalClient['clientid'];
  acls?: NodeAcl;
}

export function NetworkOldAclsPage({ isFullScreen }: NetworkOldAclPageProps) {
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;
  const { networkId } = useParams<{ networkId: string }>();
  const resolvedNetworkId = networkId || store.activeNetwork;
  const { isServerEE } = useServerLicense();
  const branding = useBranding();
  const { network, isLoadingNetwork } = useGetActiveNetwork(resolvedNetworkId);
  const [notify, notifyCtx] = notification.useNotification();
  const { token: themeToken } = theme.useToken();
  const navigate = useNavigate();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [aclRules, setAclRules] = useState<ACLRule[]>([]);
  const [originalAcls, setOriginalAcls] = useState<NodeAclContainer>({});
  const [acls, setAcls] = useState<NodeAclContainer>({});
  const { aclVersion, setAclVersion } = store;
  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [searchAclHost, setSearchAclHost] = useState('');
  const [showClientAcls, setShowClientAcls] = useState(false);
  const [isSubmittingAcls, setIsSubmittingAcls] = useState(false);

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

  const clientsMap = useMemo(
    () =>
      clients.reduce(
        (acc, c) => {
          acc[c.clientid] = c;
          return acc;
        },
        {} as Record<ExternalClient['clientid'], ExternalClient>,
      ),
    [clients],
  );

  const aclTableDataV2 = useMemo<AclTableData[]>(() => {
    // node acls
    const aclDataPerNode: AclTableData[] = networkNodes
      .map((node) => getExtendedNode(node, store.hostsCommonDetails))
      .map((node) => ({
        type: 'node',
        nodeOrClientId: node.id,
        name: node?.name ?? '',
        acls: acls[node.id],
      }));

    // client acls
    if (showClientAcls) {
      clients.forEach((client) => {
        aclDataPerNode.push({
          type: 'client',
          nodeOrClientId: client.clientid,
          name: client.clientid,
          acls: acls[client.clientid],
        });
      });
    }

    aclDataPerNode.sort((a, b) => a?.name?.localeCompare(b?.name ?? '') ?? 0);
    return aclDataPerNode;
  }, [acls, clients, networkNodes, showClientAcls, store.hostsCommonDetails]);

  const filteredAclDataV2 = useMemo<AclTableData[]>(() => {
    return aclTableDataV2
      .filter((node) => {
        if (node.type === 'client') return true;
        const foundNode = networkNodes.find((n) => n.id === node.nodeOrClientId);
        return foundNode && !foundNode.is_static;
      })
      .filter((node) => node.name.toLowerCase().includes(searchAclHost.toLowerCase()));
  }, [aclTableDataV2, searchAclHost, networkNodes]);

  const aclTableColsV2 = useMemo<TableColumnProps<AclTableData>[]>(() => {
    const renderAclValue = (
      originalAclLevel: AclStatus,
      newAclLevel: AclStatus,
      nodeOrClientIdRowTuple: [type: 'client' | 'node', id: Node['id'] | ExternalClient['clientid']],
      nodeOrClientIdColTuple: [type: 'client' | 'node', id: Node['id'] | ExternalClient['clientid']],
    ) => {
      // always enable client-to-client ACLs sinnce that's not supported currently

      if (nodeOrClientIdRowTuple[0] === 'client' && nodeOrClientIdColTuple[0] === 'client') {
        if (newAclLevel === ACL_UNDEFINED) {
          return <DashOutlined />;
        }
        return (
          <Button
            size="small"
            style={{ color: '#3C8618', borderColor: '#274916' }}
            icon={<CheckOutlined />}
            disabled
            title="Client-to-client ACLs are not supported currently"
          />
        );
      }
      // check if acl to a client's assoc ingress has been denied
      if (
        nodeOrClientIdRowTuple[0] === 'client' &&
        clientsMap[nodeOrClientIdRowTuple[1]]?.ingressgatewayid !== nodeOrClientIdColTuple[1]
      ) {
        const clientId = nodeOrClientIdRowTuple[1];
        if (acls[clientId]?.[clientsMap[clientId]?.ingressgatewayid] === ACL_DENIED) {
          return (
            <Badge size="small" dot={originalAclLevel !== newAclLevel}>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                disabled
                title={`Disabled because client's communication to its associated gateway has been blocked`}
              />
            </Badge>
          );
        }
      } else if (
        nodeOrClientIdColTuple[0] === 'client' &&
        clientsMap[nodeOrClientIdColTuple[1]]?.ingressgatewayid !== nodeOrClientIdRowTuple[1]
      ) {
        const clientId = nodeOrClientIdColTuple[1];
        if (acls[clientId]?.[clientsMap[clientId]?.ingressgatewayid] === ACL_DENIED) {
          return (
            <Badge size="small" dot={originalAclLevel !== newAclLevel}>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                disabled
                title={`Disabled because client's communication to its associated gateway has been blocked`}
              />
            </Badge>
          );
        }
      }
      switch (newAclLevel) {
        case ACL_DENIED:
          return (
            <Badge size="small" dot={originalAclLevel !== newAclLevel}>
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={() => {
                  setAcls((prevAcls) => {
                    const newAcls = structuredClone(prevAcls);
                    newAcls[nodeOrClientIdRowTuple[1]][nodeOrClientIdColTuple[1]] = 2;
                    newAcls[nodeOrClientIdColTuple[1]][nodeOrClientIdRowTuple[1]] = 2;
                    return newAcls;
                  });
                }}
              />
            </Badge>
          );
        case ACL_ALLOWED:
          return (
            <Badge size="small" dot={originalAclLevel !== newAclLevel}>
              <Button
                size="small"
                style={{ color: '#3C8618', borderColor: '#274916' }}
                icon={<CheckOutlined />}
                onClick={() => {
                  setAcls((prevAcls) => {
                    const newAcls = structuredClone(prevAcls);
                    newAcls[nodeOrClientIdRowTuple[1]][nodeOrClientIdColTuple[1]] = 1;
                    newAcls[nodeOrClientIdColTuple[1]][nodeOrClientIdRowTuple[1]] = 1;
                    return newAcls;
                  });
                }}
              />
            </Badge>
          );
        default:
          return <DashOutlined />;
      }
    };

    return [
      {
        width: '5rem',
        fixed: 'left',
        render(_, entry) {
          return (
            <Typography.Text
              style={{
                width: '5rem',
                wordBreak: 'keep-all',
                cursor: 'pointer',
              }}
              onClick={() => setSearchAclHost(entry.name)}
            >
              {entry.name}
            </Typography.Text>
          );
        },
      },
      ...aclTableDataV2
        .filter((aclData) => {
          if (aclData.type === 'client') return true;
          const foundNode = networkNodes.find((n) => n.id === aclData.nodeOrClientId);
          return foundNode && !foundNode.is_static;
        })
        .map((aclData) => ({
          title: aclData.name,
          width: '5rem',
          render(_: unknown, aclEntry: (typeof aclTableDataV2)[0]) {
            // aclEntry => row, aclData => column
            return renderAclValue(
              // original acl status
              originalAcls[aclEntry.nodeOrClientId]?.[aclData.nodeOrClientId] ?? ACL_UNDEFINED,

              // new acl status
              acls[aclEntry.nodeOrClientId]?.[aclData?.nodeOrClientId] ?? ACL_UNDEFINED,

              // node or client IDs
              [aclEntry.type, aclEntry.nodeOrClientId],
              [aclData.type, aclData.nodeOrClientId],
            );
          },
        })),
    ];
  }, [aclTableDataV2, acls, clientsMap, originalAcls, networkNodes, setAcls]);
  const hasAclsBeenEdited = useMemo(() => JSON.stringify(acls) !== JSON.stringify(originalAcls), [acls, originalAcls]);

  const fetchACLRules = useCallback(async () => {
    try {
      if (!networkId) return;
      const aclRulesResponse = (await ACLService.getACLRules(networkId)).data.Response;
      setAclRules(aclRulesResponse);
    } catch (error) {
      notify.error({
        message: 'Failed to fetch ACL rules',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [networkId, notify]);

  useEffect(() => {
    if (isInitialLoad) {
      fetchACLRules();
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, fetchACLRules]);

  return (
    <div className="NetworkAclsPage" style={{ position: 'relative', height: '100%', padding: isFullScreen ? 0 : 24 }}>
      {isServerEE && (
        <div className="flex items-end w-full gap-4 p-5 mb-6 border border-stroke-default rounded-xl bg-bg-contrastDefault ">
          <div className="flex flex-col items-start w-full gap-2">
            <div className="flex items-center">
              <h3 className="text-text-primary text-base-semibold">Introducing the New Access Control System</h3>
              <span className="ml-2 px-2 py-0.5 text-white bg-button-primary-fill-default rounded-full text-xs">
                Beta
              </span>
            </div>
            <p className="text-base text-text-secondary">Built to make access management easier and more secure.</p>
          </div>
          <Button
            type="primary"
            onClick={() => {
              setAclVersion(2);
              navigate(getNetworkPageRoute('acls'));
            }}
          >
            Try new ACL
          </Button>{' '}
        </div>
      )}
      <div className="" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {networkHosts.length + clients.length > 50 ? (
          <Row style={{ width: '100%' }}>
            <Col xs={24}>
              <Alert
                message="Too many ACLs to display"
                description={
                  <>
                    Please use{' '}
                    <a
                      rel="no-referrer noreferrer"
                      href="https://docs.netmaker.io/docs/guide/references/nmctl#acls"
                      target="_blank"
                    >
                      NMCTL
                    </a>{' '}
                    our commandline tool to manage ACLs.
                  </>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '1rem' }}
              />
            </Col>
          </Row>
        ) : (
          <Row style={{ width: '100%' }}>
            <Col xl={12} xs={24}>
              <Input
                allowClear
                placeholder="Search host"
                value={searchAclHost}
                onChange={(ev) => setSearchAclHost(ev.target.value)}
                prefix={<SearchOutlined />}
                className="search-acl-host-input"
              />
              {isServerEE && (
                <span className="show-clients-toggle" data-nmui-intercom="network-details-acls_showclientstoggle">
                  <label style={{ marginRight: '1rem' }} htmlFor="show-clients-acl-switch">
                    Show Clients
                  </label>
                  <Switch
                    id="show-clients-acl-switch"
                    checked={showClientAcls}
                    onChange={(newVal) => setShowClientAcls(newVal)}
                  />
                </span>
              )}
            </Col>
            <Col xl={12} xs={24} className="mt-10 acl-tab-buttons">
              <Button
                title="Allow All"
                style={{ marginRight: '1rem', color: '#3C8618', borderColor: '#274916' }}
                icon={<CheckOutlined />}
                onClick={() => {
                  setAcls((prevAcls) => {
                    const newAcls = structuredClone(prevAcls);
                    for (const nodeId1 in newAcls) {
                      if (Object.prototype.hasOwnProperty.call(newAcls, nodeId1)) {
                        const nodeAcl = newAcls[nodeId1];
                        for (const nodeId in nodeAcl) {
                          if (Object.prototype.hasOwnProperty.call(nodeAcl, nodeId)) {
                            nodeAcl[nodeId] = 2;
                          }
                        }
                      }
                    }
                    return newAcls;
                  });
                }}
              />
              <Button
                danger
                title="Block All"
                style={{ marginRight: '1rem' }}
                icon={<StopOutlined />}
                onClick={() => {
                  setAcls((prevAcls) => {
                    const newAcls = structuredClone(prevAcls);
                    for (const nodeId1 in newAcls) {
                      if (Object.prototype.hasOwnProperty.call(newAcls, nodeId1)) {
                        const nodeAcl = newAcls[nodeId1];
                        for (const nodeId in nodeAcl) {
                          if (Object.prototype.hasOwnProperty.call(nodeAcl, nodeId)) {
                            nodeAcl[nodeId] = 1;
                          }
                        }
                      }
                    }
                    return newAcls;
                  });
                }}
              />
              <Button
                title="Reset"
                style={{ marginRight: '1rem' }}
                icon={<ReloadOutlined />}
                onClick={() => {
                  setAcls(originalAcls);
                }}
                disabled={!hasAclsBeenEdited}
              />
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    if (!networkId) return;
                    setIsSubmittingAcls(true);
                    const newAcls = (await NetworksService.updateAclsV2(networkId, acls)).data;
                    setOriginalAcls(newAcls);
                    setAcls(newAcls);
                    notify.success({
                      message: 'ACLs updated',
                    });
                  } catch (err) {
                    notify.error({
                      message: 'Error updating ACLs',
                      description: extractErrorMsg(err as any),
                    });
                  } finally {
                    setIsSubmittingAcls(false);
                  }
                }}
                disabled={!hasAclsBeenEdited}
                loading={isSubmittingAcls}
              >
                Submit Changes
              </Button>
              <Button
                style={{ marginLeft: '1rem' }}
                onClick={() => alert('not implemented')}
                icon={<InfoCircleOutlined />}
              >
                Take Tour
              </Button>
              <Button
                title="Go to ACL documentation"
                style={{ marginLeft: '1rem' }}
                href={ExternalLinks.ACLS_DOCS_URL}
                target="_blank"
                icon={<QuestionCircleOutlined />}
              />
            </Col>

            <Col xs={24} style={{ paddingTop: '1rem' }}>
              <div className="" style={{ width: '100%', overflow: 'auto' }}>
                <VirtualisedTable
                  columns={aclTableColsV2}
                  dataSource={filteredAclDataV2}
                  className="acl-table"
                  rowKey="nodeOrClientId"
                  size="small"
                  pagination={false}
                  scroll={{
                    x: '100%',
                  }}
                />
              </div>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
}

export default NetworkOldAclsPage;
