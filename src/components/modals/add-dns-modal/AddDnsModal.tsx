import { Button, Col, Divider, Form, Input, Modal, notification, Row, Select } from 'antd';
import { MouseEvent, useMemo, useState } from 'react';
import { NetworksService } from '@/services/NetworksService';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { AxiosError } from 'axios';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Network } from '@/models/Network';
import { DNS } from '@/models/Dns';
import { Node } from '@/models/Node';
import { truncateCidrFromIp } from '@/utils/NetworkUtils';

interface AddDnsModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateDns: (dns: DNS) => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function AddDnsModal({ isOpen, onCreateDns, onCancel, networkId }: AddDnsModalProps) {
  const [form] = Form.useForm<DNS>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const nodeOptions = useMemo<{ label: string; value: Node['id'] }[]>(
    () =>
      store.nodes
        .filter((node) => node.network === networkId)
        .map((node) => ({
          label: `${node.address}, ${node.address6} (${store.hostsCommonDetails[node.hostid]?.name ?? ''})`,
          value: node.id,
        })),
    [networkId, store.hostsCommonDetails, store.nodes]
  );

  const createDns = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      const node = store.nodes.find((node) => node.id === form.getFieldValue('nodeId'));
      const dns = (
        await NetworksService.createDns(networkId, {
          ...formData,
          address: truncateCidrFromIp(node?.address ?? ''),
          address6: truncateCidrFromIp(node?.address6 ?? ''),
        })
      ).data;
      onCreateDns(dns);
      notify.success({ message: `DNS entry ${dns.name} created` });
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to create network',
          description: extractErrorMsg(err),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a DNS Entry</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-dns-form" form={form} layout="vertical">
          <Form.Item label="DNS name" name="name" rules={[{ required: true }]}>
            <Input placeholder="example" addonAfter={`.${networkId}`} />
          </Form.Item>

          <Form.Item label="Host to alias" name="nodeId" rules={[{ required: true }]}>
            <Select options={nodeOptions} placeholder="Select a host" />
          </Form.Item>

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Button type="primary" onClick={createDns} loading={isSubmitting}>
                  Create DNS
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
