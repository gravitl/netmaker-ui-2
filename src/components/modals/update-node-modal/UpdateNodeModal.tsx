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
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

interface UpdateNodeModalProps {
  isOpen: boolean;
  node: Node;
  onUpdateNode: (node: Node) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function UpdateNodeModal({ isOpen, node, onUpdateNode, onCancel }: UpdateNodeModalProps) {
  const [form] = Form.useForm<Node>();
  const [notify, notifyCtx] = notification.useNotification();
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
      notify.success({ message: `Host ${node.id} updated` });
      storeUpdateNode(newNode.id, newNode);
      onUpdateNode(newNode);
    } catch (err) {
      notify.error({
        message: 'Failed to update host',
        description: extractErrorMsg(err as any),
      });
    }
  };

  return (
    <Modal
      title={
        <Typography.Title style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Update host (ID: {node.id})
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
        initialValues={{ ...node, expdatetime: moment(node.expdatetime * 1000) }}
      >
        <div className="scrollable-modal-body">
          <div className="CustomModalBody">
            <Form.Item label="IP Address (IPv4)" name="address" rules={[{ required: true }]}>
              <Input placeholder="IP address" />
            </Form.Item>

            {network?.isipv6 && (
              <Form.Item label="IP Address (IPv6)" name="address6" rules={[{ required: true }]}>
                <Input placeholder="MTU" />
              </Form.Item>
            )}

            <Form.Item label="Local Address" name="localaddress">
              <Select
                placeholder="Local address"
                options={
                  host?.interfaces.map((iface) => ({
                    label: `${iface.name} (${iface.addressString})`,
                    value: iface.addressString,
                  })) ?? []
                }
              />
            </Form.Item>

            <Form.Item label="Persistent Keepalive" name="persistentkeepalive" rules={[{ required: true }]}>
              <InputNumber placeholder="Persistent keepalive" min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Expiration Date" name="expdatetime" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} clearIcon={false} />
            </Form.Item>

            <Form.Item label="Endpoint IP" name="endpoint" rules={[{ required: isStaticVal }]}>
              <Input placeholder="Endpoint IP" disabled={!isStaticVal} />
            </Form.Item>

            <Form.Item label="ACL Rule" name="defaultacl" rules={[{ required: true }]}>
              <Select
                placeholder="ACL Rule"
                options={[
                  { label: 'Allow', value: 'yes' },
                  { label: 'Deny', value: 'no' },
                  { label: 'Unset', value: 'unset' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Connected" name="connected" valuePropName="checked" rules={[{ required: true }]}>
              <Switch />
            </Form.Item>

            <Form.Item label="DNS On" name="dnson" valuePropName="checked" rules={[{ required: true }]}>
              <Switch />
            </Form.Item>
          </div>
        </div>
        <Divider style={{ margin: '0px 0px 2rem 0px' }} />

        <div className="CustomModalBody">
          <Row>
            <Col xs={12}>
              <Form.Item noStyle>
                <Button onClick={() => navigate(getHostRoute(node.hostid, { edit: 'true' }))}>Edit Host Details</Button>
              </Form.Item>
            </Col>
            <Col xs={12} style={{ textAlign: 'right' }}>
              <Form.Item noStyle>
                <Button type="primary" onClick={updateNode}>
                  Update Host
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>

      {/* notify */}
      {notifyCtx}
    </Modal>
  );
}
