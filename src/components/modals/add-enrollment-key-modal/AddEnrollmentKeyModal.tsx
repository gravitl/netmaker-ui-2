import '../CustomModal.scss';
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
  Radio,
  Row,
  Select,
} from 'antd';
import { MouseEvent, Ref, useMemo, useState } from 'react';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { CreateEnrollmentKeyReqDto } from '@/services/dtos/CreateEnrollmentKeyReqDto';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { useStore } from '@/store/store';
import { Modify } from '@/types/react-app-env';
import dayjs, { Dayjs } from 'dayjs';
import { ExtendedNode } from '@/models/Node';
import { getExtendedNode, isNodeRelay } from '@/utils/NodeUtils';

interface AddEnrollmentKeyModalProps {
  isOpen: boolean;
  onCreateKey: (key: EnrollmentKey) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  networkId?: string;
  keyNameInputRef?: Ref<HTMLDivElement>;
  keyTypeSelectRef?: Ref<HTMLDivElement>;
  keyNetworksSelectRef?: Ref<HTMLDivElement>;
  keyRelaySelectRef?: Ref<HTMLDivElement>;
}

type AddEnrollmentKeyFormData = Modify<CreateEnrollmentKeyReqDto, { expiration: Dayjs }>;

export default function AddEnrollmentKeyModal({
  isOpen,
  onCreateKey,
  onCancel,
  networkId,
  keyNameInputRef,
  keyTypeSelectRef,
  keyNetworksSelectRef,
  keyRelaySelectRef,
}: AddEnrollmentKeyModalProps) {
  const [form] = Form.useForm<AddEnrollmentKeyFormData>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const isServerEE = store.serverConfig?.IsEE === 'yes';
  const networksVal = Form.useWatch('networks', form);

  const networkOptions = useMemo(() => {
    if (networkId) {
      return store.networks.filter((n) => n.netid === networkId).map((n) => ({ label: n.netid, value: n.netid }));
    }
    return store.networks.map((n) => ({ label: n.netid, value: n.netid }));
  }, [networkId, store.networks]);

  const [type, setType] = useState<'unlimited' | 'uses' | 'time'>('unlimited');

  const resetModal = () => {
    form.resetFields();
  };

  const relays = useMemo<ExtendedNode[]>(() => {
    const relayNodes = store.nodes
      .filter((node) => isNodeRelay(node) && networksVal?.includes(node.network))
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));
    if (!isServerEE) {
      return [];
    }
    return relayNodes;
  }, [isServerEE, networksVal, store.hostsCommonDetails, store.nodes]);

  const createEnrollmentKey = async () => {
    try {
      let formData: AddEnrollmentKeyFormData;
      try {
        formData = await form.validateFields();
      } catch (err) {
        return;
      }

      // reformat payload for backend
      // type is automatically determined by backend
      formData.tags = [String(form.getFieldValue('tags')).trim()];
      formData.type = 0;

      const payload: CreateEnrollmentKeyReqDto = {
        ...formData,
        unlimited: type === 'unlimited' ? true : false,
        uses_remaining: formData.uses_remaining ?? 0,
        expiration: type === 'time' ? Math.round(formData.expiration.unix()) : 0,
      };
      const key = (await EnrollmentKeysService.createEnrollmentKey(payload)).data;
      notify.success({ message: `Enrollment key with name ${key.tags.join(', ')} created` });
      resetModal();
      onCreateKey(key);
    } catch (err) {
      notify.error({
        message: 'Failed to create key',
        description: extractErrorMsg(err as any),
      });
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Key</span>}
      open={isOpen}
      onCancel={(ev) => {
        resetModal();
        onCancel && onCancel(ev);
      }}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-enrollment-key-form" form={form} layout="vertical">
          <Row ref={keyNameInputRef}>
            <Col xs={24}>
              <Form.Item
                label="Name"
                name="tags"
                rules={[
                  { required: true, min: 3, max: 32 },
                  { whitespace: true, pattern: /^[a-zA-Z0-9- ]+$/ },
                ]}
                data-nmui-intercom="add-enrollment-key-form_tags"
              >
                {/* <Select mode="tags" style={{ width: '100%' }} placeholder="Tags" /> */}
                <Input placeholder="Name" />
              </Form.Item>
            </Col>
          </Row>

          <Row ref={keyTypeSelectRef}>
            <Col xs={24}>
              <Form.Item
                label="Type"
                name="type"
                rules={[{ required: true }]}
                data-nmui-intercom="add-enrollment-key-form_type"
              >
                <Radio.Group onChange={(e) => setType(e.target.value)} value={type}>
                  <Radio value="unlimited">Unlimited</Radio>
                  <Radio value="uses">Limited number of uses</Radio>
                  <Radio value="time">Time bound</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {type === 'uses' && (
            <Form.Item
              label="Max. number of uses"
              name="uses_remaining"
              rules={[{ required: true }]}
              data-nmui-intercom="add-enrollment-key-form_usesremaining"
            >
              <InputNumber placeholder="Max. number of uses" min={1} style={{ width: '100%' }} />
            </Form.Item>
          )}
          {type === 'time' && (
            <Form.Item
              label="Time bound"
              name="expiration"
              rules={[{ required: true }]}
              data-nmui-intercom="add-enrollment-key-form_expiration"
            >
              <DatePicker
                style={{ width: '100%' }}
                showTime
                disabledDate={(d) => {
                  return dayjs().isAfter(d);
                }}
              />
            </Form.Item>
          )}

          <Row ref={keyNetworksSelectRef}>
            {' '}
            <Col xs={24}>
              <Form.Item
                name="networks"
                label="Networks"
                data-nmui-intercom="add-enrollment-key-form_networks"
                initialValue={networkId ? [networkId] : undefined}
              >
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Select networks to join with key"
                  options={networkOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          {isServerEE && (
            <Row ref={keyRelaySelectRef}>
              {' '}
              <Col xs={24}>
                <Form.Item name="relay" label="Relay" data-nmui-intercom="add-enrollment-key-form_relays">
                  <Select
                    placeholder="Select relay to join with key"
                    allowClear
                    style={{ width: '100%' }}
                    options={relays.map((node) => ({ label: `${node.name} (${node.network})`, value: node.id }))}
                    disabled={networksVal?.length === 0}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item data-nmui-intercom="add-enrollment-key-form_submit">
                <Button type="primary" onClick={createEnrollmentKey}>
                  Create Key
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
