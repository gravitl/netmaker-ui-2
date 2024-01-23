import { Button, Col, Divider, Image, Input, Modal, notification, Row, Select, Spin, Switch, Typography } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { NodesService } from '@/services/NodesService';
import { ExternalClient } from '@/models/ExternalClient';
import { CopyOutlined } from '@ant-design/icons';

const { TextArea } = Input;
interface ClientConfigModalProps {
  isOpen: boolean;
  client: ExternalClient;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function ClientConfigModal({ client, isOpen, onCancel }: ClientConfigModalProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const [config, setConfig] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const downloadClientData = async () => {
    try {
      setIsLoading(true);
      const qrData = (await NodesService.getExternalClientConfig(client.clientid, client.network, 'file'))
        .data as string;
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

  useEffect(() => {
    downloadClientData();
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
            icon={<CopyOutlined />}
            disabled={isLoading}
            onClick={() => {
              navigator.clipboard.writeText(config);
              notify.success({ message: 'Copied to clipboard' });
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
              <TextArea value={config} style={{ fontFamily: 'monospace' }} autoSize={true} disabled />
            )}
          </Col>
        </Row>
      </div>

      {/* misc */}
      {notifyCtx}
    </Modal>
  );
}
