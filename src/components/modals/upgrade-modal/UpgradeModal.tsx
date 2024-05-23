import { Button, Divider, Modal } from 'antd';
import { MouseEvent } from 'react';
import '../CustomModal.scss';
import { getAmuiUrl, getLicenseDashboardUrl } from '@/utils/RouteUtils';
import { isSaasBuild } from '@/services/BaseService';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';

interface UpgradeModalProps {
  isOpen: boolean;
  onUpgrade?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function UpgradeModal({ isOpen, onUpgrade: onOk, onCancel }: UpgradeModalProps) {
  const goToLicenceUpgradePage = () => {
    window.location = isSaasBuild ? (getAmuiUrl('upgrade') as any) : (getLicenseDashboardUrl() as any);
  };

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
        <h3>
          <span style={{ marginBottom: '0px', fontSize: '1.7rem', fontWeight: 'bold' }}>Professional </span>
          <span>license gives you more...</span>
        </h3>
        <p>
          Unlock unlimited networks, OAuth (Social Sign-On) authentication, Internet Gateways, Relays and so much more!
        </p>
        {!isSaasBuild && (
          <p>
            Visit{' '}
            <a href={ExternalLinks.PRO_UPGRADE_DOCS_LINK} target="_blank" rel="noreferrer">
              our upgrade docs
            </a>{' '}
            for more information on how to upgrade.
          </p>
        )}
        <div style={{ marginTop: '2rem' }}>
          <Button type="primary" onClick={goToLicenceUpgradePage}>
            I&apos;m Ready to Upgrade
          </Button>
        </div>
      </div>
    </Modal>
  );
}
