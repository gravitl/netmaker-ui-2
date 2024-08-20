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
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import './UpdateRelayModal.styles.scss';
import { Network } from '@/models/Network';
import { ExtendedNode, Node } from '@/models/Node';
import { Host } from '@/models/Host';
import { getExtendedNode, getNodeConnectivityStatus, isNodeRelay } from '@/utils/NodeUtils';
import { CloseOutlined, DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { CreateNodeRelayDto } from '@/services/dtos/CreateNodeRelayDto';
import { NodesService } from '@/services/NodesService';
import { NULL_NODE } from '@/constants/Types';
import { useServerLicense } from '@/utils/Utils';

interface UpdateRelayModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  relay: Node;
  onUpdateRelay: (relay: Node) => any;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  addRelayedHostModalSelectHostRef?: Ref<HTMLDivElement>;
}

type UpdateRelayFormFields = CreateNodeRelayDto;

export default function UpdateRelayModal({
  relay,
  isOpen,
  onUpdateRelay,
  onCancel,
  networkId,
  addRelayedHostModalSelectHostRef,
}: UpdateRelayModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const { isServerEE } = useServerLicense();
  const [form] = Form.useForm<UpdateRelayFormFields>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRelayedIds, setSelectedRelayedIds] = useState<Host['id'][]>(relay.relaynodes ?? []);
  const [relayedSearch, setRelayedSearch] = useState('');
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);

  const getNodeConnectivity = useCallback((node: Node) => {
    if (getNodeConnectivityStatus(node) === 'error') return <Badge status="error" text="Error" />;
    else if (getNodeConnectivityStatus(node) === 'warning') return <Badge status="warning" text="Unstable" />;
    else if (getNodeConnectivityStatus(node) === 'healthy') return <Badge status="success" text="Healthy" />;
    else return <Badge status="processing" text="Unknown" />;
  }, []);

  const networkNodes = useMemo<ExtendedNode[]>(() => {
    return store.nodes
      .filter((node) => node.network === networkId)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
  }, [networkId, store.hostsCommonDetails, store.nodes]);

  const extendedRelay = useMemo<ExtendedNode>(() => {
    return getExtendedNode(relay, store.hostsCommonDetails);
  }, [relay, store.hostsCommonDetails]);

  const filteredNetworkNodes = useMemo<ExtendedNode[]>(
    () => networkNodes.filter((node) => node.name?.toLowerCase().includes(relayedSearch.toLowerCase())),
    [networkNodes, relayedSearch],
  );

  const initialRelayHealth = useMemo(() => {
    return getNodeConnectivity(extendedRelay);
  }, [extendedRelay, getNodeConnectivity]);

  const relayTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => {
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
        render(_, node) {
          const addrs = `${node.address ?? ''} ${node.address6 ? `(${node.address6})` : ''}`;
          return <Tooltip title={addrs}>{addrs}</Tooltip>;
        },
      },
    ];
  }, []);

  const relayedTableCols = useMemo<TableColumnProps<ExtendedNode>[]>(() => relayTableCols, [relayTableCols]);

  const isNodeSelectable = (node: Node): boolean => {
    if (isNodeRelay(node)) return false;
    if (node.relayedby) {
      return node.relayedby === relay.id;
    }
    return true;
  };

  const resetModal = () => {
    form.resetFields();
    setRelayedSearch('');
    setSelectedRelayedIds(relay.relaynodes ?? []);
  };

  const updateRelay = async () => {
    try {
      await form.validateFields();
      setIsSubmitting(true);
      const uniqueRelayedIds = [...new Set(selectedRelayedIds)];
      let newRelay: Node;
      if (uniqueRelayedIds.length > 0) {
        newRelay = (await NodesService.updateNode(relay.id, networkId, { ...relay, relaynodes: selectedRelayedIds }))
          .data;
      } else {
        newRelay = (await NodesService.deleteRelay(relay.id, networkId)).data;
      }
      store.updateNode(relay.id, newRelay);
      onUpdateRelay(newRelay);
      notify.success({ message: 'Relay updated' });
    } catch (err) {
      notify.error({
        message: 'Failed to update relay',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedRelayedIds(relay.relaynodes ?? []);
    }
  }, [isOpen]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Update Relay</span>}
      open={isServerEE && isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal UpdateRelayModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="update-relay-form" form={form} layout="vertical">
        <div className="CustomModalBody">
          <Row
            style={{
              border: `1px solid ${themeToken.colorBorder}`,
              padding: '.5rem',
              borderRadius: '8px',
            }}
          >
            <Col span={6}>{extendedRelay?.name ?? ''}</Col>
            <Col span={6}>
              {([] as Array<string>).concat(extendedRelay.address || [], extendedRelay.address6 || []).join(', ')}
            </Col>
            <Col span={6}>{extendedRelay?.endpointip ?? ''}</Col>
            <Col span={6}>{initialRelayHealth}</Col>
          </Row>
          <Row>
            <Col span={24} ref={addRelayedHostModalSelectHostRef}>
              <Form.Item
                label="Select hosts to relay"
                required
                style={{ marginTop: '1rem' }}
                data-nmui-intercom="update-relay-form_relayed"
              >
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
                            prefix={<SearchOutlined />}
                          />
                        </Col>
                        <Col span={16} style={{ textAlign: 'right' }}>
                          <Button
                            type="primary"
                            onClick={() => {
                              setIsDropDownOpen(false);
                            }}
                          >
                            Done
                          </Button>
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                          <div className="table-wrapper">
                            <Table
                              size="small"
                              columns={relayedTableCols}
                              rowKey="id"
                              dataSource={[...filteredNetworkNodes.filter((h) => h.id !== relay.id)].sort((a, b) =>
                                // sort non-relayed hosts to the top
                                isNodeRelay(a) === isNodeRelay(b) ? 0 : isNodeRelay(a) ? 1 : -1,
                              )}
                              onRow={(node) => {
                                return {
                                  onClick: () => {
                                    if (!isNodeSelectable(node)) return;
                                    setSelectedRelayedIds((prev) => {
                                      const relayedHostIds = new Set(prev);
                                      if (relayedHostIds.has(node.id)) {
                                        relayedHostIds.delete(node.id);
                                      } else {
                                        relayedHostIds.add(node.id);
                                      }
                                      return [...relayedHostIds];
                                    });
                                  },
                                };
                              }}
                              rowClassName={(node) => {
                                if (!isNodeSelectable(node)) return 'unavailable-row';
                                return selectedRelayedIds.includes(node.id) ? 'selected-row' : '';
                              }}
                              rowSelection={{
                                type: 'checkbox',
                                selectedRowKeys: selectedRelayedIds,
                                hideSelectAll: true,
                                onSelect: (record, selected) => {
                                  if (!isNodeSelectable(record)) return;
                                  setSelectedRelayedIds((prev) => {
                                    const relayedHostIds = new Set(prev);
                                    if (selected) {
                                      relayedHostIds.add(record.id);
                                    } else {
                                      relayedHostIds.delete(record.id);
                                    }
                                    return [...relayedHostIds];
                                  });
                                },
                                getCheckboxProps: (record) => {
                                  return { disabled: !isNodeSelectable(record) };
                                },
                              }}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                  onDropdownVisibleChange={(open) => setIsDropDownOpen(open)}
                  suffixIcon={isDropDownOpen ? <UpOutlined /> : <DownOutlined />}
                  open={isDropDownOpen}
                />
              </Form.Item>
            </Col>
          </Row>

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
              <Col span={6}>{networkNodes.find((h) => h.id === id)?.name ?? ''}</Col>
              <Col span={6}>
                {([] as Array<string>)
                  .concat(
                    networkNodes.find((h) => h.id === id)?.address || [],
                    networkNodes.find((h) => h.id === id)?.address6 || [],
                  )
                  .join(', ')}
              </Col>
              <Col span={6}>{networkNodes.find((h) => h.id === id)?.endpointip ?? ''}</Col>
              <Col span={5}>{getNodeConnectivity(networkNodes.find((n) => n.id === id) ?? NULL_NODE)}</Col>
              <Col span={1} style={{ textAlign: 'right' }}>
                <Button
                  danger
                  size="small"
                  type="primary"
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
                data-nmui-intercom="update-relay-form_submitbtn"
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
