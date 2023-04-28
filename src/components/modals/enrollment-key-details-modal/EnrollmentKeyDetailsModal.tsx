import '../CustomModal.scss';
import { Col, Divider, Modal, Row, Typography } from 'antd';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import moment from 'moment';
import { MouseEvent } from 'react';

interface EnrollmentKeyDetailsModalProps {
  isOpen: boolean;
  enrollmentKey: EnrollmentKey;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function EnrollmentKeyDetailsModal({ isOpen, enrollmentKey, onCancel }: EnrollmentKeyDetailsModalProps) {
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
        <Row>
          <Col xs={8}>
            <Typography.Text>Tags</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.tags.join(', ')}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row>
          <Col xs={8}>
            <Typography.Text>Value</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.value}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row>
          <Col xs={8}>
            <Typography.Text>Is unlimited</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.unlimited ? 'Yes' : 'No'}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row>
          <Col xs={8}>
            <Typography.Text>Uses remaining</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.uses_remaining}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row>
          <Col xs={8}>
            <Typography.Text>Expires at</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{moment(enrollmentKey.expiration).toLocaleString()}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row>
          <Col xs={8}>
            <Typography.Text>Networks</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.networks.join(', ')}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row>
          <Col xs={24}>
            <Typography.Text type="secondary">Netclient CLI command:</Typography.Text>
            <br />
            <Typography.Text copyable>{`netclient register -t ${enrollmentKey.token}`}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
      </div>
    </Modal>
  );
}
