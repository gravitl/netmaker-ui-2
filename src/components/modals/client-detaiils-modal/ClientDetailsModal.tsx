import { Button, Col, Divider, Image, Modal, notification, Row, Select, Switch, Typography } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import '../CustomModal.scss';
import { DownloadOutlined } from '@ant-design/icons';
import { download, extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { ExternalClient } from '@/models/ExternalClient';
import { Buffer } from 'buffer';

interface ClientDetailsModalProps {
  isOpen: boolean;
  client: ExternalClient;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  onUpdateClient: (newClient: ExternalClient) => void;
}

function convertQrCodeArrayBufferToImgString(qrData: ArrayBuffer): string {
  return 'data:image/png;base64,' + Buffer.from(qrData).toString('base64');
}

export default function ClientDetailsModal({ client, isOpen, onCancel, onUpdateClient }: ClientDetailsModalProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [qrCode, setQrCode] = useState(' '); // hack to allow qr code display

  const downloadClientData = async () => {
    try {
      notify.info({ message: 'Downloading...' });
      const qrData = (await NodesService.getExternalClientConfig(client.clientid, client.network, 'file'))
        .data as string;
      download(`${client.clientid}.conf`, qrData);
    } catch (err) {
      notify.error({
        message: 'Failed to download client config',
        description: extractErrorMsg(err as any),
      });
    }
  };

  const loadQrCode = useCallback(async () => {
    try {
      const qrData = (await NodesService.getExternalClientConfig(client.clientid, client.network, 'qr'))
        .data as ArrayBuffer;
      setQrCode(convertQrCodeArrayBufferToImgString(qrData));
    } catch (err) {
      notify.error({
        message: 'Failed to load client config',
        description: extractErrorMsg(err as any),
      });
    }
  }, [client, notify]);

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

  useEffect(() => {
    loadQrCode();
  }, [loadQrCode]);

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
            <Select
              key={client.clientid}
              mode="multiple"
              disabled
              placeholder="Allowed IPs"
              defaultValue={[client.address, client.address6].concat(
                client.extraallowedips ? client.extraallowedips : [],
              )}
            />
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

        <Row data-nmui-intercom="client-details_qr">
          <Col xs={24}>
            <Image
              loading="eager"
              className="qr-code-container"
              preview={{ width: 600, height: 600 }}
              alt={`qr code for client ${client.clientid}`}
              src={qrCode}
              style={{ borderRadius: '8px' }}
              width={256}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: '1rem' }} data-nmui-intercom="client-details_downloadbtn">
          <Col xs={24}>
            <Button onClick={downloadClientData}>
              <DownloadOutlined /> Download config
            </Button>
          </Col>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
