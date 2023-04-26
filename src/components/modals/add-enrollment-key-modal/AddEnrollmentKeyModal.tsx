import '../CustomModal.scss';
import { Button, Col, DatePicker, Divider, Form, InputNumber, Modal, notification, Radio, Row, Select } from 'antd';
import { MouseEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { CreateEnrollmentKeyReqDto } from '@/services/dtos/CreateEnrollmentKeyReqDto';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { useStore } from '@/store/store';
import moment from 'moment';
import { Modify } from '@/types/react-app-env';

interface AddEnrollmentKeyModalProps {
  isOpen: boolean;
  onCreateKey: (key: EnrollmentKey) => any;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type AddEnrollmentKeyFormData = Modify<CreateEnrollmentKeyReqDto, { expiration: moment.Moment }>;

export default function AddEnrollmentKeyModal({ isOpen, onCreateKey, onCancel }: AddEnrollmentKeyModalProps) {
  const [form] = Form.useForm<AddEnrollmentKeyFormData>();
  const [notify, notifyCtx] = notification.useNotification();
  const navigate = useNavigate();
  const store = useStore();
  const networkOptions = store.networks.map((n) => ({ label: n.netid, value: n.netid }));

  const [type, setType] = useState<'unlimited' | 'uses' | 'time'>('unlimited');

  const createEnrollmentKey = async () => {
    try {
      const formData = await form.validateFields();
      const payload: CreateEnrollmentKeyReqDto = {
        ...formData,
        unlimited: type === 'unlimited' ? true : false,
        uses_remaining: formData.uses_remaining ?? 0,
        expiration: type === 'time' ? Math.round(formData.expiration.unix()) : 0,
      };
      const key = (await EnrollmentKeysService.createEnrollmentKey(payload)).data;
      notify.success({ message: `Enrollment key with tags ${key.tags.join(', ')} created` });
      navigate(AppRoutes.ENROLLMENT_KEYS_ROUTE);
      onCreateKey(key);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Failed to create key',
          description: extractErrorMsg(err),
        });
      }
    }
  };

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create a Key</span>}
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form name="add-enrollment-key-form" form={form} layout="vertical">
          <Form.Item label="Tags" name="tags" rules={[{ required: true }]}>
            <Select mode="tags" style={{ width: '100%' }} placeholder="Tags" />
          </Form.Item>

          <Form.Item label="Type" name="type" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => setType(e.target.value)} value={type}>
              <Radio value="unlimited">Unlimited</Radio>
              <Radio value="uses">Limited number of uses</Radio>
              <Radio value="time">Time bound</Radio>
            </Radio.Group>
          </Form.Item>

          {type === 'uses' && (
            <Form.Item label="Max. number of uses" name="uses_remaining" rules={[{ required: true }]}>
              <InputNumber placeholder="Max. number of uses" min={1} style={{ width: '100%' }} />
            </Form.Item>
          )}
          {type === 'time' && (
            <Form.Item label="Time bound" name="expiration" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          )}

          <Form.Item name="networks" label="Networks">
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Select networks to join with key"
              options={networkOptions}
            />
          </Form.Item>

          <Row>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Form.Item>
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
