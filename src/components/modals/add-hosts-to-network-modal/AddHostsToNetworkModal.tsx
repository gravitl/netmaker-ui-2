import { Button, Col, Divider, Form, Input, Modal, notification, Row, Table } from 'antd';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { Network } from '@/models/Network';
import { Host } from '@/models/Host';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { HostsService } from '@/services/HostsService';
import { SearchOutlined } from '@ant-design/icons';

interface AddHostsToNetworkModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onNetworkUpdated: () => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function AddHostsToNetworkModal({
  isOpen,
  onNetworkUpdated,
  onCancel,
  networkId,
}: AddHostsToNetworkModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const [hostSearch, setHostSearch] = useState('');

  const network = useMemo(() => {
    return store.networks.find((network) => network.netid === networkId);
  }, [networkId, store.networks]);

  const nonNetworkHosts = useMemo<Host[]>(() => {
    const allHosts = new Set(store.hosts);
    store.nodes.forEach((node) => {
      if (node.network === networkId) {
        const assocHost = store.hosts.find((h) => h.id === node.hostid);
        if (assocHost) allHosts.delete(assocHost);
      }
    });
    return [...allHosts];
  }, [networkId, store.hosts, store.nodes]);

  const filteredNonNetworkHosts = useMemo<Host[]>(() => {
    return nonNetworkHosts.filter((host) => host.name.toLocaleLowerCase().includes(hostSearch.toLocaleLowerCase()));
  }, [hostSearch, nonNetworkHosts]);

  const resetModal = () => {};

  const connectHostToNetwork = useCallback(
    (host: Host) => {
      Modal.confirm({
        title: 'Connect host to network',
        content: `Are you sure you want to connect ${host.name} to network ${networkId}?`,
        async onOk() {
          try {
            if (!networkId) return;
            await HostsService.updateHostsNetworks(host.id, networkId, 'join');
            notify.success({
              message: 'Successfully connected to network',
              description: `${host.name} is now connected to network ${networkId}. This may take some seconds to reflect.`,
            });
          } catch (err) {
            notify.error({
              message: 'Failed to join network',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [networkId, notify],
  );

  // TODO: add autofill for fields
  return (
    <Modal
      title={
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add Hosts to network {network?.netid ?? ''}</span>
      }
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      className="CustomModal AddHostsToNetworkModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form name="add-hosts-to-networks-form" layout="vertical">
        <div className="CustomModalBody">
          <Row>
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
                dataSource={filteredNonNetworkHosts}
                columns={[
                  {
                    title: 'Host',
                    dataIndex: 'name',
                    sorter: (a, b) => a.name.localeCompare(b.name),
                    defaultSortOrder: 'ascend',
                  },
                  {
                    title: 'Endpoint',
                    dataIndex: 'endpointip',
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
                    render(_, host) {
                      return (
                        <Button size="small" onClick={() => connectHostToNetwork(host)}>
                          Connect
                        </Button>
                      );
                    },
                  },
                ]}
                rowKey="id"
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
                  onNetworkUpdated();
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
