import { Button, Col, Divider, Form, Input, Modal, notification, Row, Table, Typography } from 'antd';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { SearchOutlined } from '@ant-design/icons';
import { ExtendedNode } from '@/models/Node';
import { getExtendedNode } from '@/utils/NodeUtils';
import { NodesService } from '@/services/NodesService';

interface SetNetworkFailoverModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onSetFailover: () => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function SetNetworkFailoverModal({
  isOpen,
  onSetFailover,
  onCancel,
  networkId,
}: SetNetworkFailoverModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const storeFetchNodes = store.fetchNodes;

  const [hostSearch, setHostSearch] = useState('');

  const network = useMemo(() => {
    return store.networks.find((network) => network.netid === networkId);
  }, [networkId, store.networks]);

  const networkNodes = useMemo<ExtendedNode[]>(
    () => store.nodes.filter((n) => n.network === networkId).map((n) => getExtendedNode(n, store.hostsCommonDetails)),
    [networkId, store.hostsCommonDetails, store.nodes],
  );

  const filteredNetworkNodes = useMemo<ExtendedNode[]>(() => {
    return networkNodes.filter((n) => n.name?.toLocaleLowerCase().includes(hostSearch.toLocaleLowerCase()));
  }, [hostSearch, networkNodes]);

  const resetModal = () => {};

  const setAsNetworkFailover = useCallback(
    (node: ExtendedNode) => {
      Modal.confirm({
        title: `Set ${node.name} as the failover host`,
        content: 'Are you sure you want to make this host the network failover host',
        okText: 'Yes',
        cancelText: 'No',
        onOk: async () => {
          try {
            // remove current failover
            const currentFailoverNode = networkNodes.find((n) => n.is_fail_over);
            if (currentFailoverNode) {
              await NodesService.removeNodeFailoverStatus(currentFailoverNode.id);
            }
            await NodesService.setNodeAsFailover(node.id);
            notify.success({ message: 'Network failover successfully selected' });
            storeFetchNodes();
            onSetFailover();
          } catch (err) {
            notify.error({
              message: 'Error setting host as failover',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkNodes, notify, onSetFailover, storeFetchNodes],
  );

  return (
    <Modal
      title={
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Select a host to act as the failover for this network.
        </span>
      }
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal SetNetworkFailoverModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-hosts-to-networks-form" layout="vertical">
        <div className="CustomModalBody">
          <Row>
            <Col>
              <Typography.Text>
                The failover host acts as a &ldquo;backup relay&rdquo; in case of direct connection failure.
              </Typography.Text>
            </Col>
          </Row>
          <Row style={{ marginTop: '1rem' }}>
            <Col xs={24}>
              <Input
                placeholder="Search host"
                value={hostSearch}
                onChange={(ev) => setHostSearch(ev.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: '1rem' }}>
            <Col xs={24}>
              <Table
                size="small"
                dataSource={filteredNetworkNodes}
                columns={[
                  {
                    title: 'Host',
                    dataIndex: 'name',
                    sorter: (a, b) => a.name?.localeCompare(b.name || '') ?? 0,
                    defaultSortOrder: 'ascend',
                  },
                  network?.isipv4
                    ? {
                        title: 'Private Address (IPv4)',
                        dataIndex: 'address',
                      }
                    : {},
                  network?.isipv6
                    ? {
                        title: 'Private Address (IPv6)',
                        dataIndex: 'address6',
                      }
                    : {},
                  {
                    title: 'Endpoint',
                    dataIndex: 'endpointip',
                    render: (_, node) => [node.endpointip, node.endpointipv6].filter(Boolean).join(', '),
                  },
                  {
                    title: 'Public Port',
                    dataIndex: 'listenport',
                  },
                  {
                    title: 'Version',
                    dataIndex: 'version',
                  },
                  {
                    align: 'right',
                    render(_, node) {
                      return (
                        <Button size="small" onClick={() => setAsNetworkFailover(node)}>
                          Set as Failover
                        </Button>
                      );
                    },
                  },
                ]}
                rowKey="id"
                scroll={{
                  x: true,
                }}
              />
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '0px 0px 2rem 0px' }} />
        <div className="CustomModalBody">
          <Row>
            <Col xs={24} style={{ textAlign: 'left' }}>
              <Button
                type="primary"
                onClick={(ev) => {
                  onCancel?.(ev as any);
                }}
              >
                Close
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
