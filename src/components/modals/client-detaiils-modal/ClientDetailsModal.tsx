import { Button, Col, Divider, Modal, notification, Row, Switch, Tooltip, Typography } from 'antd';
import { MouseEvent, useCallback } from 'react';
import '../CustomModal.scss';
import { EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { ExternalClient } from '@/models/ExternalClient';
import { useStore } from '@/store/store';
import { isAdminUserOrRole } from '@/utils/UserMgmtUtils';

interface ClientDetailsModalProps {
  isOpen: boolean;
  client: ExternalClient;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  onUpdateClient: (newClient: ExternalClient) => void;
  onViewConfig?: () => void;
}

export default function ClientDetailsModal({
  client,
  isOpen,
  onCancel,
  onUpdateClient,
  onViewConfig,
}: ClientDetailsModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const toggleClientStatus = useCallback(
    async (newStatus: boolean) => {
      Modal.confirm({
        title: `Are you sure you want to ${newStatus ? 'enable' : 'disable'} client ${client.clientid}?`,
        content: `Client ${client.clientid} will be ${newStatus ? 'enabled' : 'disabled'}.`,
        onOk: async () => {
          try {
            const newClient = (
              await NodesService.updateExternalClient(client.clientid, client.network, {
                ...client,
                clientid: client.clientid,
                enabled: newStatus,
              })
            ).data;
            onUpdateClient(newClient);
          } catch (err) {
            notify.error({
              message: 'Failed to update client',
              description: extractErrorMsg(err as any),
            });
          }
        },
      });
    },
    [client, notify, onUpdateClient],
  );

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Client Information</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      className="ClientDetailsModal CustomModal"
      style={{ minWidth: '50vw' }}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Row data-nmui-intercom="client-details_id">
          <Col xs={8}>
            <Typography.Text>ID</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{client.clientid}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row data-nmui-intercom="client-details_allowedips">
          <Col xs={8}>
            <Typography.Text>Allowed IPs</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>
              {([] as Array<string>)
                .concat(client.address ? client.address : [])
                .concat(client.address6 ? client.address6 : [])
                .concat(client.extraallowedips ? client.extraallowedips : [])
                .join(', ')}
            </Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row data-nmui-intercom="client-details_publickey">
          <Col xs={8}>
            <Typography.Text>Public key</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text copyable>{client.publickey}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row data-nmui-intercom="client-details_dns">
          <Col xs={8}>
            <Typography.Text>Client DNS</Typography.Text>
          </Col>
          <Col xs={16}>{client.dns && <Typography.Text copyable>{client.dns}</Typography.Text>}</Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row data-nmui-intercom="client-details_status">
          <Col xs={8}>
            <Typography.Text>Status</Typography.Text>
          </Col>
          <Col xs={16}>
            <Switch checked={client.enabled} onChange={(checked) => toggleClientStatus(checked)} />
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row data-nmui-intercom="client-details_dns">
          <Col xs={8}>
            <Typography.Text>
              Post Up Script
              <Tooltip title="PostUp serves as a lifetime hook that runs the provided script that run just after wireguard sets up the interface and the VPN connection is live">
                <InfoCircleOutlined style={{ marginLeft: '0.3em' }} />
              </Tooltip>
            </Typography.Text>
          </Col>
          <Col xs={16}>{client.postup && <Typography.Text copyable> {client.postup} </Typography.Text>}</Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row data-nmui-intercom="client-details_dns">
          <Col xs={8}>
            <Typography.Text>
              Post Down Script
              <Tooltip title="PostDown serves as a lifetime hook that runs the provided script that run just after wireguard tears down the interface">
                <InfoCircleOutlined style={{ marginLeft: '0.3em' }} />
              </Tooltip>
            </Typography.Text>
          </Col>
          <Col xs={16}>{client.postdown && <Typography.Text copyable> {client.postdown} </Typography.Text>}</Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />

        <Row style={{ marginTop: '2rem' }} data-nmui-intercom="client-details_downloadbtn">
          <Col xs={24}>
            <Button
              onClick={onViewConfig}
              disabled={!isAdminUserOrRole(store.user!) && store.username !== client.ownerid}
            >
              <EyeOutlined /> View/Download config
            </Button>
          </Col>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
