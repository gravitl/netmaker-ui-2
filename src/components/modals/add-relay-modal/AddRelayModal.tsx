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
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import './AddRelayModal.styles.scss';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { Host } from '@/models/Host';
import { getNodeConnectivityStatus } from '@/utils/NodeUtils';
import { CloseOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { AxiosError } from 'axios';
import { CreateHostRelayDto } from '@/services/dtos/CreateHostRelayDto';
import { HostsService } from '@/services/HostsService';

interface AddRelayModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateRelay: () => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const hostIdFormName = 'hostid';

type AddRelayFormFields = CreateHostRelayDto;

export default function AddRelayModal({ isOpen, onCreateRelay, onCancel, networkId }: AddRelayModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [form] = Form.useForm<AddRelayFormFields>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relaySearch, setRelaySearch] = useState('');
  const [selectedRelay, setSelectedRelay] = useState<Host | null>(null);
  const [selectedRelayedIds, setSelectedRelayedIds] = useState<Host['id'][]>([]);
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
      .map((node) => ({ ...node, ...store.hostsCommonDetails[node.hostid] }));
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
    return store.nodes.filter((node) => node.network === networkId).map((node) => hostsMap.get(node.hostid)!);
  }, [networkId, store.hosts, store.nodes]);

  const filteredNetworkHosts = useMemo<Host[]>(
    () => networkHosts.filter((host) => host.name?.toLowerCase().includes(relaySearch.toLowerCase())),
    [networkHosts, relaySearch]
  );

  const selectedRelayAssocNode = useMemo<Node | null>(() => {
    if (!selectedRelay) return null;
    return networkNodes.find((node) => node.hostid === selectedRelay.id) ?? null;
  }, [selectedRelay, networkNodes]);

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

  const createRelay = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);

      if (!selectedRelay) return;

      await HostsService.createHostRelay(selectedRelay.id, { ...formData, relayed_hosts: selectedRelayedIds });
      onCreateRelay();
      notify.success({ message: `Relay created` });
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to create relay',
          description: extractErrorMsg(err),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadHosts = useCallback(async () => {
    try {
      await store.fetchHosts();
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to load hosts',
          description: extractErrorMsg(err),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify]);

  useEffect(() => {
    // TODO: move to upper component
    loadHosts();
  }, [loadHosts]);

  // TODO: add autofill for fields
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Relay</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      className="CustomModal AddRelayModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-relay-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <Form.Item label="Select host" name={hostIdFormName} rules={[{ required: true }]}>
            {!selectedRelay && (
              <Select
                placeholder="Select host"
                dropdownRender={() => (
                  <div style={{ padding: '.5rem' }}>
                    <Row style={{ marginBottom: '1rem' }}>
                      <Col span={8}>
                        <Input
                          placeholder="Search host..."
                          value={relaySearch}
                          onChange={(e) => setRelaySearch(e.target.value)}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Table
                          size="small"
                          columns={relayTableCols}
                          dataSource={filteredNetworkHosts}
                          onRow={(host) => {
                            return {
                              onClick: () => {
                                const canSelect = !host.isrelay && !host.isrelayed;
                                if (!canSelect) return;
                                form.setFieldValue(hostIdFormName, host.id);
                                setSelectedRelay(host);
                              },
                            };
                          }}
                          rowClassName={(host) => {
                            const canSelect = !host.isrelay && !host.isrelayed;
                            return canSelect ? '' : 'unavailable-row';
                          }}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              />
            )}
            {!!selectedRelay && (
              <>
                <Row
                  style={{
                    border: `1px solid ${themeToken.colorBorder}`,
                    padding: '.5rem',
                    borderRadius: '8px',
                  }}
                >
                  <Col span={6}>{selectedRelay?.name ?? ''}</Col>
                  <Col span={6}>{selectedRelayAssocNode?.address ?? ''}</Col>
                  <Col span={6}>{selectedRelay?.endpointip ?? ''}</Col>
                  <Col span={5}>{selectedRelayAssocNode && getNodeConnectivity(selectedRelayAssocNode)}</Col>
                  <Col span={1} style={{ textAlign: 'right' }}>
                    <Button
                      danger
                      size="small"
                      type="text"
                      title="Unselect"
                      icon={<CloseOutlined />}
                      onClick={() => {
                        form.setFieldValue(hostIdFormName, '');
                        setSelectedRelay(null);
                      }}
                    />
                  </Col>
                </Row>
              </>
            )}
          </Form.Item>

          {selectedRelay && (
            <>
              <Form.Item label="Select hosts to relay" required>
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
                            dataSource={[...filteredNetworkHosts.filter((h) => h.id !== selectedRelay.id)].sort(
                              (a, b) =>
                                // sort non-relayed hosts to the top
                                a.isrelay === b.isrelay ? 0 : a.isrelay ? 1 : -1
                            )}
                            onRow={(host) => {
                              return {
                                onClick: () => {
                                  const canSelect = !host.isrelay && !host.isrelayed;
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
                              const canSelect = !host.isrelay && !host.isrelayed;
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
                    {networkHostToNodesMap.get(id) && getNodeConnectivity(networkHostToNodesMap.get(id)!)}
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

              {selectedRelayedIds.length === 0 && (
                <Row>
                  <Col xs={24}>
                    <Typography.Text type="danger">You must select at least one host to be relayed.</Typography.Text>
                  </Col>
                </Row>
              )}
            </>
          )}
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'left' }}>
              <Button type="primary" onClick={createRelay} loading={isSubmitting}>
                Create Relay
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
