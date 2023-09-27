import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Row,
  Select,
  Switch,
  Typography,
} from 'antd';
import { MouseEvent } from 'react';
import { useStore } from '@/store/store';
import '../CustomModal.scss';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { Host } from '@/models/Host';
import { Node } from '@/models/Node';
import { getHostRoute } from '@/utils/RouteUtils';
import { NodesService } from '@/services/NodesService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { NODE_EXP_TIME_FORMAT } from '@/constants/AppConstants';

interface UpdateNodeModalProps {
  isOpen: boolean;
  node: Node;
  onUpdateNode: (node: Node) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function UpdateNodeModal({ isOpen, node, onUpdateNode, onCancel }: UpdateNodeModalProps) {
  const [form] = Form.useForm<Node>();
  const store = useStore();
  const navigate = useNavigate();

  const storeUpdateNode = store.updateNode;
  const isStaticVal: Host['isstatic'] = Form.useWatch('isstatic', form);

  const network = store.networks.find((n) => n.netid === node.network);
  const host = store.hosts.find((h) => h.id === node.hostid);

  const resetModal = () => {
    form.resetFields();
  };

  const updateNode = async () => {
    try {
      const formData = await form.validateFields();
      const newNode = (
        await NodesService.updateNode(node.id, node.network, {
          ...node,
          ...formData,
          expdatetime: Math.floor(new Date(formData.expdatetime).getTime() / 1000),
        })
      ).data;
      notification.success({ message: `Host ${node.id} updated` });
      storeUpdateNode(newNode.id, newNode);
      onUpdateNode(newNode);
    } catch (err) {
      notification.error({
        message: 'Failed to update host',
        description: extractErrorMsg(err as any),
      });
    }
  };

  const disabledDateTime = () => ({
    disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i + 1),
  });

  return (
    <Modal
      title={
        <Typography.Title style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Update host&apos;s Network Settings
          <br />
          <small>(ID: {node.id})</small>
        </Typography.Title>
      }
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <Form
        name="update-node-form"
        form={form}
        layout="vertical"
        initialValues={{ ...node, expdatetime: dayjs(node.expdatetime * 1000), endpointip: host?.endpointip ?? '' }}
      >
        <div className="scrollable-modal-body">
          <div className="CustomModalBody">
            <Form.Item
              label="IP Address (IPv4)"
              name="address"
              rules={[{ required: true }]}
              data-nmui-intercom="update-node-form_address"
            >
              <Input placeholder="IPv4 address" />
            </Form.Item>

            {network?.isipv6 && (
              <Form.Item
                label="IP Address (IPv6)"
                name="address6"
                rules={[{ required: true }]}
                data-nmui-intercom="update-node-form_address6"
              >
                <Input placeholder="IPv6 appress" />
              </Form.Item>
            )}

            <Form.Item label="Local Address" name="localaddress" data-nmui-intercom="update-node-form_localaddress">
              <Select
                placeholder="Local address"
                options={
                  host?.interfaces?.map((iface) => ({
                    label: `${iface.name} (${iface.addressString})`,
                    value: iface.addressString,
                  })) ?? []
                }
              />
            </Form.Item>

            <Form.Item
              label="Expiration Date"
              name="expdatetime"
              rules={[{ required: true }]}
              data-nmui-intercom="update-node-form_expdatetime"
            >
              <DatePicker
                showTime={true}
                disabledTime={disabledDateTime}
                style={{ width: '100%' }}
                clearIcon={false}
                format={NODE_EXP_TIME_FORMAT}
              />
            </Form.Item>

            <Form.Item
              label="Endpoint IP"
              name="endpointip"
              rules={[{ required: isStaticVal }]}
              data-nmui-intercom="update-node-form_endpointip"
            >
              <Input
                placeholder="Endpoint IP"
                disabled={!isStaticVal}
                title="To edit, click Global Host Settings below"
              />
            </Form.Item>

            <Form.Item
              label="Default ACL Rule"
              name="defaultacl"
              rules={[{ required: true }]}
              data-nmui-intercom="update-node-form_defaultacl"
            >
              <Select
                placeholder="ACL Rule"
                options={[
                  { label: 'Allow', value: 'yes' },
                  { label: 'Deny', value: 'no' },
                  { label: 'Unset', value: 'unset' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Connected"
              name="connected"
              valuePropName="checked"
              rules={[{ required: true }]}
              data-nmui-intercom="update-node-form_connected"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="DNS On"
              name="dnson"
              valuePropName="checked"
              rules={[{ required: true }]}
              data-nmui-intercom="update-node-form_dnson"
            >
              <Switch />
            </Form.Item>
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />

        <div className="CustomModalBody">
          <Row>
            <Col xs={12}>
              <Form.Item noStyle data-nmui-intercom="update-node-form_editglobalhost">
                <Button onClick={() => navigate(getHostRoute(node.hostid, { edit: 'true' }))}>
                  Go to Global Host Settings
                </Button>
              </Form.Item>
            </Col>
            <Col xs={12} style={{ textAlign: 'right' }}>
              <Form.Item noStyle data-nmui-intercom="update-node-form_submit">
                <Button type="primary" onClick={updateNode}>
                  Update Host
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  );
}
