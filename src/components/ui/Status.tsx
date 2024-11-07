import { type NodeConnectivityStatus } from '@/models/NodeConnectivityStatus';
import { Col, Modal, Row } from 'antd';
import { CircleCheckIcon, CircleSlashIcon, CircleXIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';

interface StatusProps {
  nodeHealth: NodeConnectivityStatus;
  clickable?: boolean;
}

export default function NodeStatus(props: StatusProps) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const getTextColor = () => {
    switch (props.nodeHealth) {
      case 'healthy':
      case 'enabled':
        return '#07C98D';
      case 'warning':
        return '#C98C07';
      case 'error':
        return '#E32C08';
      case 'disconnected':
      case 'disabled':
        return '#D4D4D4';
      case 'unknown':
        return '#D4D4D4';
      default:
        return '#D4D4D4';
    }
  };

  const getBgColor = () => {
    switch (props.nodeHealth) {
      case 'healthy':
      case 'enabled':
        return '#07C98D1A';
      case 'warning':
        return '#C98C071A';
      case 'error':
        return '#E32C081A';
      case 'disconnected':
      case 'disabled':
        return '#D4D4D41A';
      case 'unknown':
        return '#D4D4D41A';
      default:
        return '#D4D4D41A';
    }
  };

  const getStatusText = (infoModalTitle = false) => {
    switch (props.nodeHealth) {
      case 'healthy':
      case 'enabled':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleCheckIcon className="text-green-600 inline-block mr-2" /> Node{' '}
            {props.nodeHealth === 'enabled' ? ' Enabled' : ' Connected'}
          </span>
        ) : props.nodeHealth === 'enabled' ? (
          'Enabled'
        ) : (
          'Connected'
        );
      case 'warning':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <TriangleAlertIcon className="text-yellow-600 inline-block mr-2" /> Degraded Performance
          </span>
        ) : (
          'Warning'
        );
      case 'error':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleXIcon className="text-red-600 inline-block mr-2" /> Connection Lost
          </span>
        ) : (
          'Error'
        );
      case 'disconnected':
      case 'disabled':
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleSlashIcon className="text-neutral-600 inline-block mr-2" /> Node{' '}
            {props.nodeHealth === 'disabled' ? ' Disabled' : ' Disconnected'}
          </span>
        ) : props.nodeHealth === 'disabled' ? (
          'Disabled'
        ) : (
          'Disconnected'
        );
      default:
        return infoModalTitle ? (
          <span className="inline-flex justify-center">
            <CircleSlashIcon className="text-neutral-600 inline-block mr-2" /> Unknown Node Status
          </span>
        ) : (
          'Unknown'
        );
    }
  };

  const getStatusDesc = () => {
    switch (props.nodeHealth) {
      case 'healthy':
        return 'Node is healthy and connected. All systems are functioning normally.';
      case 'warning':
        return 'Node connectivity is degraded. Network performance may be affected.';
      case 'error':
        return 'Node connection lost. Check network settings or re-sync the node.';
      case 'disconnected':
        return 'Node is disconnected from the network. You can connect to restore connection.';
      default:
        return "Node's status is unknown. It may no longer be connected to any network on this server.";
    }
  };

  return (
    <>
      <span
        className="rounded-full text-nowrap whitespace-nowrap"
        style={{
          padding: '.2rem .5rem',
          color: getTextColor(),
          backgroundColor: getBgColor(),
          cursor: props.clickable ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (!props.clickable) return;
          setIsInfoModalOpen(true);
        }}
      >
        &#9679; {getStatusText()}
      </span>

      {/* modals */}
      <Modal
        title={getStatusText(true)}
        open={isInfoModalOpen}
        width="30vw"
        onCancel={() => setIsInfoModalOpen(false)}
        footer={null}
        centered
      >
        <hr className="border-neutral-700" />
        <Row style={{ marginTop: '2rem' }}>
          <Col span={24}>{getStatusDesc()}</Col>
        </Row>
      </Modal>
    </>
  );
}
