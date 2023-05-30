import {
  Badge,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Table,
  TableColumnProps,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import './UpdateRelayModal.styles.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { Host } from '@/models/Host';
import { getExtendedNode, getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { CreateHostRelayDto } from '@/services/dtos/CreateHostRelayDto';
import { HostsService } from '@/services/HostsService';
import { NULL_HOST, NULL_NODE } from '@/constants/Types';

interface UpdateRelayModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  relay: Host;
  onUpdateRelay: (relay: Host) => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type UpdateRelayFormFields = CreateHostRelayDto;

export default function UpdateRelayModal({ relay, isOpen, onUpdateRelay, onCancel, networkId }: UpdateRelayModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [form] = Form.useForm<UpdateRelayFormFields>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRelayedIds, setSelectedRelayedIds] = useState<Host['id'][]>(relay.relay_hosts ?? []);
  const [relayedSearch, setRelayedSearch] = useState('');

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const networkNodes = useMemo<Node[]>(() => {
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => ({ ...node, ...getExtendedNode(node, store.hostsCommonDetails) }));
  }, [networkId, store.hostsCommonDetails, store.nodes]);

  const networkHostToNodesMap = useMemo(() => {
    const nodesMap = new Map<Host['id'], Node>();
    networkNodes.forEach((node) => {
      nodesMap.set(node.hostid, node);
    });
    return nodesMap;
  }, [networkNodes]);

  const networkHosts = useMemo(() => {
    const hostsMap = new Map<Host['id'], Host>();
    store.hosts.forEach((host) => {
      hostsMap.set(host.id, host);
    });
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => hostsMap.get(node.hostid) ?? NULL_HOST);
  }, [networkId, store.hosts, store.nodes]);

  const filteredNetworkHosts = useMemo<Host[]>(
    () => networkHosts.filter((host) => host.name?.toLowerCase().includes(relayedSearch.toLowerCase())),
    [networkHosts, relayedSearch]
  );

  const selectedRelayAssocNode = useMemo<Node | null>(() => {
    if (!relay) return null;
    return networkNodes.find((node) => node.hostid === relay.id) ?? null;
  }, [relay, networkNodes]);

  const relayTableCols = useMemo<TableColumnProps<Host>[]>(() => {
    return [
      {
        title: 'Select host',
        dataIndex: 'name',
        render(value) {
          return <Typography.Link>{value}</Typography.Link>;
        },
      },
      {
        title: 'Address',
        dataIndex: 'address',
        render(_, host) {
          const assocNode = networkHostToNodesMap.get(host.id);
          const addrs = `${assocNode?.address ?? ''}, ${assocNode?.address6 ?? ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
      {
        title: 'Endpoint',
        dataIndex: 'endpointip',
      },
    ];
  }, [networkHostToNodesMap]);

  const relayedTableCols = useMemo<TableColumnProps<Host>[]>(() => relayTableCols, [relayTableCols]);

  const resetModal = () => {
    form.resetFields();
    setRelayedSearch('');
    setSelectedRelayedIds(relay.relay_hosts ?? []);
  };

  const updateRelay = async () => {
    try {
      await form.validateFields();
      setIsSubmitting(true);
      const uniqueRelayedIds = [...new Set(selectedRelayedIds)];
      let newRelay: Host;
      if (uniqueRelayedIds.length > 0) {
        newRelay = (await HostsService.updateHost(relay.id, { ...relay, relay_hosts: selectedRelayedIds })).data;
      } else {
        newRelay = (await HostsService.deleteHostRelay(relay.id)).data;
      }
      store.updateHost(relay.id, newRelay);
      onUpdateRelay(newRelay);
      notify.success({ message: `Relay updated` });
    } catch (err) {
      notify.error({
        message: 'Failed to update relay',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Relay</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal UpdateRelayModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-relay-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <Row
            style={{
              border: `1px solid ${themeToken.colorBorder}`,
              padding: '.5rem',
              borderRadius: '8px',
            }}
          >
            <Col span={6}>{relay?.name ?? ''}</Col>
            <Col span={6}>{selectedRelayAssocNode?.address ?? ''}</Col>
            <Col span={6}>{relay?.endpointip ?? ''}</Col>
            <Col span={6}>{selectedRelayAssocNode && getNodeConnectivity(selectedRelayAssocNode)}</Col>
          </Row>

          <Form.Item label="Select hosts to relay" required style={{ marginTop: '1rem' }}>
            <Select
              placeholder="Select hosts to relay"
              dropdownRender={() => (
                <div style={{ padding: '.5rem' }}>
                  <Row style={{ marginBottom: '1rem' }}>
                    <Col span={8}>
                      <Input
                        placeholder="Search host..."
                        value={relayedSearch}
                        onChange={(e) => setRelayedSearch(e.target.value)}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <Table
                        size="small"
                        columns={relayedTableCols}
                        rowKey="id"
                        dataSource={[...filteredNetworkHosts.filter((h) => h.id !== relay.id)].sort((a, b) =>
                          // sort non-relayed hosts to the top
                          a.isrelay === b.isrelay ? 0 : a.isrelay ? 1 : -1
                        )}
                        onRow={(host) => {
                          return {
                            onClick: () => {
                              const canSelect = (() => {
                                if (host.isrelay) return false;
                                if (host.isrelayed) {
                                  return host.relayed_by === relay.id;
                                }
                                return true;
                              })();
                              if (!canSelect) return;
                              setSelectedRelayedIds((prev) => {
                                const relayedHostIds = new Set(prev);
                                if (relayedHostIds.has(host.id)) {
                                  relayedHostIds.delete(host.id);
                                } else {
                                  relayedHostIds.add(host.id);
                                }
                                return [...relayedHostIds];
                              });
                            },
                          };
                        }}
                        rowClassName={(host) => {
                          const canSelect = (() => {
                            if (host.isrelay) return false;
                            if (host.isrelayed) {
                              return host.relayed_by === relay.id;
                            }
                            return true;
                          })();
                          if (!canSelect) return 'unavailable-row';
                          return selectedRelayedIds.includes(host.id) ? 'selected-row' : '';
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              )}
            />
          </Form.Item>

          {selectedRelayedIds.map((id) => (
            <Row
              key={id}
              style={{
                border: `1px solid ${themeToken.colorBorder}`,
                padding: '.5rem',
                borderRadius: '8px',
                marginBottom: '.5rem',
              }}
            >
              <Col span={6}>{networkHosts.find((h) => h.id === id)?.name ?? ''}</Col>
              <Col span={6}>{networkHostToNodesMap.get(id)?.address ?? ''}</Col>
              <Col span={6}>{networkHosts.find((h) => h.id === id)?.endpointip ?? ''}</Col>
              <Col span={5}>
                {networkHostToNodesMap.get(id) && getNodeConnectivity(networkHostToNodesMap.get(id) ?? NULL_NODE)}
              </Col>
              <Col span={1} style={{ textAlign: 'right' }}>
                <Button
                  danger
                  size="small"
                  type="text"
                  title="Unselect"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setSelectedRelayedIds((prev) => prev.filter((i) => i !== id));
                  }}
                />
              </Col>
            </Row>
          ))}
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'left' }}>
              <Button
                type="primary"
                onClick={updateRelay}
                loading={isSubmitting}
                danger={selectedRelayedIds.length === 0}
              >
                {selectedRelayedIds.length === 0 ? 'Delete Relay' : 'Update Relay'}
              </Button>
            </Col>
          </Row>
        </div>
      </Form>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
