import '../CustomModal.scss';
import { Col, DatePicker, Divider, Form, Input, InputNumber, Modal, Row, Select, Switch, Typography } from 'antd';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { CreateEnrollmentKeyReqDto } from '@/services/dtos/CreateEnrollmentKeyReqDto';
import { useStore } from '@/store/store';
import moment from 'moment';
import { Modify } from '@/types/react-app-env';
import { MouseEvent } from 'react';

interface EnrollmentKeyDetailsModalProps {
  isOpen: boolean;
  enrollmentKey: EnrollmentKey;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type AddEnrollmentKeyFormData = Modify<CreateEnrollmentKeyReqDto, { expiration: moment.Moment }>;

export default function EnrollmentKeyDetailsModal({ isOpen, enrollmentKey, onCancel }: EnrollmentKeyDetailsModalProps) {
  const [form] = Form.useForm<AddEnrollmentKeyFormData>();
  const store = useStore();
  const networkOptions = store.networks.map((n) => ({ label: n.netid, value: n.netid }));

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Enrollment Key</span>}
      open={isOpen}
      footer={null}
      centered
      className="CustomModal"
      onCancel={onCancel}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Form
          name="add-enrollment-key-details-form"
          form={form}
          initialValues={{ ...enrollmentKey, expiration: moment(enrollmentKey.expiration) }}
          layout="vertical"
          disabled
        >
          <Form.Item label="Tags" name="tags" rules={[{ required: true }]}>
            <Select mode="tags" style={{ width: '100%' }} placeholder="Tags" />
          </Form.Item>

          <Form.Item label="Value (ID)" name="value">
            <Input placeholder="Value (ID)" />
          </Form.Item>

          <Form.Item label="Is unlimited" name="unlimited" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Max. number of uses" name="uses_remaining">
            <InputNumber placeholder="Max. number of uses" min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Expires at" name="expiration">
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>

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
            <Col xs={24}>
              <Typography.Text type="secondary">Netclient CLI command:</Typography.Text>
              <br />
              <Typography.Text copyable>netclient register -t {enrollmentKey.token}</Typography.Text>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
}
