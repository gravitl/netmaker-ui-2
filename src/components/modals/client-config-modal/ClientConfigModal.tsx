import { Button, Col, Divider, Image, Input, Modal, notification, Row, Select, Spin } from 'antd';
import { MouseEvent, useEffect, useMemo, useState } from 'react';
import '../CustomModal.scss';
import { download, extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { ExternalClient } from '@/models/ExternalClient';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Node } from '@/models/Node';
import { useStore } from '@/store/store';
import { getExtendedNode } from '@/utils/NodeUtils';
import { Buffer } from 'buffer';
import { copyTextToClipboard, useServerLicense } from '@/utils/Utils';

const { TextArea } = Input;
interface ClientConfigModalProps {
  isOpen: boolean;
  client: ExternalClient;
  gateway: Node;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

function convertQrCodeArrayBufferToImgString(qrData: ArrayBuffer): string {
  return 'data:image/png;base64,' + Buffer.from(qrData).toString('base64');
}

export default function ClientConfigModal({ client, gateway, isOpen, onCancel }: ClientConfigModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { isServerEE } = useServerLicense();

  const [config, setConfig] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [qrCode, setQrCode] = useState(' '); // hack to allow qr code display

  const gatewayHost = useMemo(
    () => getExtendedNode(gateway, store.hostsCommonDetails),
    [gateway, store.hostsCommonDetails],
  );

  const loadClientConfig = async (endpoint: string) => {
    try {
      setIsLoading(true);
      const qrData = (
        await NodesService.getExternalClientConfig(client.clientid, client.network, 'file', endpoint.trim())
      ).data as string;
      setConfig(qrData);
      setIsLoading(false);
    } catch (err) {
      notify.error({
        message: 'Failed to load client config',
        description: extractErrorMsg(err as any),
      });
      setIsLoading(false);
    }
  };

  const downloadClientConfig = async (endpoint: string) => {
    try {
      const qrData = (
        await NodesService.getExternalClientConfig(client.clientid, client.network, 'file', endpoint.trim())
      ).data as string;
      download(`${client.clientid}.conf`, qrData);
    } catch (err) {
      notify.error({
        message: 'Failed to download client config',
        description: extractErrorMsg(err as any),
      });
    }
  };

  const autoSelectEndpoint = (): string => {
    const endpoint = gatewayHost.endpointip || gatewayHost.endpointipv6 || '';
    setSelectedEndpoint(endpoint);
    return endpoint;
  };

  const loadQrCode = async (endpoint: string) => {
    try {
      const qrData = (await NodesService.getExternalClientConfig(client.clientid, client.network, 'qr', endpoint))
        .data as ArrayBuffer;
      setQrCode(convertQrCodeArrayBufferToImgString(qrData));
    } catch (err) {
      notify.error({
        message: 'Failed to load client config',
        description: extractErrorMsg(err as any),
      });
    }
  };

  useEffect(() => {
    const endpoint = autoSelectEndpoint();
    loadClientConfig(endpoint);
    loadQrCode(endpoint);
  }, [isOpen]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Client Config</span>}
      open={isOpen}
      onCancel={onCancel}
      centered
      className="ClientDetailsModal CustomModal"
      style={{ minWidth: '50vw' }}
      footer={
        <>
          <Button
            icon={<DownloadOutlined />}
            disabled={isLoading}
            onClick={() => {
              downloadClientConfig(selectedEndpoint);
              notify.info({ message: 'Downloading config file...' });
            }}
            style={{ margin: '0px 20px 20px 0px' }}
          >
            Download
          </Button>

          <Button
            icon={<CopyOutlined />}
            disabled={isLoading}
            onClick={async () => {
              try {
                await copyTextToClipboard(config);
                notify.success({ message: 'Copied to clipboard' });
              } catch (err) {
                notify.error({
                  message: 'Failed to copy to clipboard',
                  description: extractErrorMsg(err as any),
                });
              }
            }}
            style={{ margin: '0px 20px 20px 0px' }}
          >
            Copy
          </Button>
        </>
      }
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Row>
          <Col span={24}>
            {isLoading ? (
              <Spin />
            ) : (
              <>
                <label>Remote Access Gateway Endpoint</label>
                <Select
                  style={{ width: '100%', marginBottom: '2rem' }}
                  options={([] as Array<{ value: string; label: string }>)
                    .concat(
                      gatewayHost.endpointip ? [{ value: gatewayHost.endpointip, label: gatewayHost.endpointip }] : [],
                    )
                    .concat(
                      gatewayHost.endpointipv6
                        ? [{ value: gatewayHost.endpointipv6, label: gatewayHost.endpointipv6 }]
                        : [],
                    )
                    .concat(
                      isServerEE ? gateway.additional_rag_ips?.map((ip) => ({ value: ip, label: ip })) ?? [] : [],
                    )}
                  value={selectedEndpoint}
                  onChange={(selectedEndpoint) => {
                    setSelectedEndpoint(selectedEndpoint);
                    loadClientConfig(selectedEndpoint);
                    loadQrCode(selectedEndpoint);
                  }}
                />
                <TextArea
                  value={config}
                  style={{ fontFamily: 'monospace', marginBottom: '2rem' }}
                  autoSize={true}
                  disabled
                />
                <label>QR code</label> <br />
                <Image
                  loading="eager"
                  className="qr-code-container"
                  preview={{ width: 600, height: 600 }}
                  alt={`qr code for client ${client.clientid}`}
                  src={qrCode}
                  style={{ borderRadius: '8px' }}
                  width={256}
                />
              </>
            )}
          </Col>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
