import '../CustomModal.scss';
import { Col, Divider, Modal, Row, Tag, Typography } from 'antd';
import { EnrollmentKey, TimeBoundEnrollmentKey, UsesBasedEnrollmentKey } from '@/models/EnrollmentKey';
import { MouseEvent, useMemo } from 'react';
import { isEnrollmentKeyValid, renderEnrollmentKeyType } from '@/utils/EnrollmentKeysUtils';
import dayjs from 'dayjs';
import { useStore } from '@/store/store';
import { getExtendedNode } from '@/utils/NodeUtils';
import { useServerLicense } from '@/utils/Utils';

interface EnrollmentKeyDetailsModalProps {
  isOpen: boolean;
  enrollmentKey: EnrollmentKey;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function EnrollmentKeyDetailsModal({ isOpen, enrollmentKey, onCancel }: EnrollmentKeyDetailsModalProps) {
  const shouldShowExpDate =
    enrollmentKey.type === TimeBoundEnrollmentKey ||
    (enrollmentKey.uses_remaining === 0 && enrollmentKey.unlimited === false);

  const store = useStore();
  const { isServerEE } = useServerLicense();

  const relayName = useMemo<string>(() => {
    const networkNodes = store.nodes
      .filter((node) => enrollmentKey.relay === node.id)
      .map((node) => getExtendedNode(node, store.hostsCommonDetails));

    if (!isServerEE || networkNodes.length === 0) {
      return '';
    }

    return networkNodes[0]?.name || '';
  }, [isServerEE, enrollmentKey.relay, store.nodes, store.hostsCommonDetails]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Enrollment Key</span>}
      open={isOpen}
      footer={null}
      centered
      className="EnrollmentKeyDetailsModal CustomModal"
      onCancel={onCancel}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <Row data-nmui-intercom="enrollment-key-details_name">
          <Col xs={8}>
            <Typography.Text>Name</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.tags.join(', ')}</Typography.Text>
            <Tag style={{ marginLeft: '1rem' }} color={isEnrollmentKeyValid(enrollmentKey) ? 'success' : 'error'}>
              {isEnrollmentKeyValid(enrollmentKey) ? 'Valid' : 'Invalid'}
            </Tag>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_token">
          <Col xs={8}>
            <Typography.Text>Key</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.token}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_type">
          <Col xs={8}>
            <Typography.Text>Type</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{renderEnrollmentKeyType(enrollmentKey.type)}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_unlimited">
          <Col xs={8}>
            <Typography.Text>Is unlimited</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.unlimited ? 'Yes' : 'No'}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_usesremaining">
          <Col xs={8}>
            <Typography.Text>Uses remaining</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>
              {enrollmentKey.type === UsesBasedEnrollmentKey ? enrollmentKey.uses_remaining : 'n/a'}
            </Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_expiration">
          <Col xs={8}>
            <Typography.Text>Expires at</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>
              {shouldShowExpDate ? dayjs(enrollmentKey.expiration).toLocaleString() : 'never'}
            </Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_networks">
          <Col xs={8}>
            <Typography.Text>Networks</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{enrollmentKey.networks.join(', ')}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_relay">
          <Col xs={8}>
            <Typography.Text>Relay</Typography.Text>
          </Col>
          <Col xs={16}>
            <Typography.Text>{relayName}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
        <Row data-nmui-intercom="enrollment-key-details_joincmd">
          <Col xs={24}>
            <Typography.Text type="secondary">Join Server via CLI:</Typography.Text>
            <br />
            <Typography.Text copyable code>{`netclient join -t ${enrollmentKey.token}`}</Typography.Text>
          </Col>
        </Row>
        <Divider style={{ margin: '1rem 0px 1rem 0px' }} />
      </div>
    </Modal>
  );
}
