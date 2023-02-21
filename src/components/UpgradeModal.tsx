import { Button, Divider, Modal } from 'antd';
import { MouseEvent } from 'react';
import './CustomModal.scss';

interface UpgradeModalProps {
  isOpen: boolean;
  onUpgrade?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function UpgradeModal({ isOpen, onUpgrade: onOk, onCancel }: UpgradeModalProps) {
  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Upgrade Plan</span>}
      open={isOpen}
      onOk={onOk}
      onCancel={onCancel}
      footer={null}
      centered
      className="CustomModal"
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />
      <div className="CustomModalBody">
        <h3 style={{ fontWeight: 'normal', marginBottom: '0px' }}>Professional</h3>
        <div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>$99</span> per month
        </div>
        <p style={{ marginTop: '0px' }}>Unlock unlimited networks</p>
        <div>
          {/* TODO: redirect to accounts platform -- open new tab, refresh netmaker ui when process is complete */}
          <Button type="primary">I&apos;m Ready to Upgrade</Button>
        </div>
      </div>
    </Modal>
  );
}
