import { AutoComplete, Button, Col, Divider, Form, Input, Modal, notification, Row } from 'antd';
import { MouseEvent, useMemo, useState } from 'react';
import { NetworksService } from '@/services/NetworksService';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Network } from '@/models/Network';
import { DNS } from '@/models/Dns';
import { Node } from '@/models/Node';
import { isValidIpv4OrCidr, isValidIpv6OrCidr, truncateIpFromCidr } from '@/utils/NetworkUtils';
import { getExtendedNode } from '@/utils/NodeUtils';
import { Rule } from 'antd/es/form';

interface AddDnsModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateDns: (dns: DNS) => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function AddDnsModal({ isOpen, onCreateDns, onCancel, networkId }: AddDnsModalProps) {
  const [form] = Form.useForm<DNS & { ip: string }>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const nodeOptions = useMemo<{ label: string; value: Node['id'] }[]>(
    () =>
      store.nodes
        .filter((node) => node.network === networkId)
        .map((node) => ({
          label: `${node.address}, ${node.address6} (${getExtendedNode(node, store.hostsCommonDetails)?.name ?? ''})`,
          value: node.address ?? node.address6 ?? '',
        })),
    [networkId, store.hostsCommonDetails, store.nodes],
  );

  const resetModal = () => {
    form.resetFields();
  };

  const createDns = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);
      const isIpv4 = isValidIpv4OrCidr(formData.ip);
      const isIpv6 = isValidIpv6OrCidr(formData.ip);
      if (!isIpv4 && !isIpv6) {
        throw new Error('Invalid IP address');
      }
      const dns = (
        await NetworksService.createDns(networkId, {
          ...formData,
          address: truncateIpFromCidr(isIpv4 ? formData.ip : ''),
          address6: truncateIpFromCidr(isIpv6 ? formData.ip : ''),
        })
      ).data;
      resetModal();
      onCreateDns(dns);
      notify.success({ message: `DNS entry ${dns.name} created` });
    } catch (err) {
      notify.error({
        message: 'Failed to create dns entry',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateUrl = (_: any, value: string) => {
    /* eslint-disable */
    const regex = /^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}$/; // Regular expression for url validation
  
    if (regex.test(value)) {
      return Promise.resolve();
    } else {
      return Promise.reject("Please enter a valid URL.");
    }
  };

  const validateUrlInput: Rule[] = [
    { required: true, message: "Please enter a value." },
    { validator: validateUrl },
  ];

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a DNS Entry</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      centered
      className="CustomModal AddDnsModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-dns-form" form={form} layout="vertical">
          <Form.Item label="DNS name" name="name" rules={validateUrlInput} data-nmui-intercom="add-dns-form_name">
            <Input placeholder="myserver.example.com" />
          </Form.Item>

          <Form.Item
            label="Address to alias"
            name="ip"
            rules={[{ required: true }]}
            data-nmui-intercom="add-dns-form_ip"
          >
            <AutoComplete options={nodeOptions} style={{ width: '100%' }} placeholder="Address" />
          </Form.Item>

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Button
                  type="primary"
                  onClick={createDns}
                  loading={isSubmitting}
                  data-nmui-intercom="add-dns-form_submitbtn"
                >
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
