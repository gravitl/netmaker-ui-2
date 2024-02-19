import { AutoComplete, Button, Col, Divider, Form, Input, Modal, notification, Row } from 'antd';
import { MouseEvent, Ref, useMemo, useState } from 'react';
import { NetworksService } from '@/services/NetworksService';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Network } from '@/models/Network';
import { DNS } from '@/models/Dns';
import { Node } from '@/models/Node';
import { isValidIpv4OrCidr, isValidIpv6OrCidr, truncateIpFromCidr } from '@/utils/NetworkUtils';
import { getExtendedNode } from '@/utils/NodeUtils';

interface AddDnsModalProps {
  isOpen: boolean;
  networkId: Network['netid'];
  onCreateDns: (dns: DNS) => any;
  closeModal?: () => void;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  addDNSModalDNSNameRef: Ref<HTMLDivElement>;
  addDNSModalAddressToAliasRef: Ref<HTMLDivElement>;
}

export default function AddDnsModal({
  isOpen,
  onCreateDns,
  onCancel,
  networkId,
  addDNSModalAddressToAliasRef,
  addDNSModalDNSNameRef,
}: AddDnsModalProps) {
  const [form] = Form.useForm<DNS & { ip: string }>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const nodeOptions = useMemo<{ label: string; value: Node['id'] }[]>(
    () =>
      store.nodes
        .filter((node) => node.network === networkId)
        .map((node) => {
          const addrs = ([] as Array<string>).concat(node.address || [], node.address6 || []).join(', ');
          return {
            label: `${addrs} (${getExtendedNode(node, store.hostsCommonDetails)?.name ?? ''})`,
            value: node.address ?? node.address6 ?? '',
          };
        }),
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
          <Row>
            <Col xs={24} ref={addDNSModalDNSNameRef}>
              <Form.Item
                label="DNS name"
                name="name"
                rules={[{ required: true, whitespace: true }]}
                data-nmui-intercom="add-dns-form_name"
              >
                <Input placeholder="myserver.example.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col xs={24} ref={addDNSModalAddressToAliasRef}>
              <Form.Item
                label="Address to alias"
                name="ip"
                rules={[{ required: true }]}
                data-nmui-intercom="add-dns-form_ip"
              >
                <AutoComplete options={nodeOptions} style={{ width: '100%' }} placeholder="Address" />
              </Form.Item>
            </Col>
          </Row>

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
