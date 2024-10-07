import React from 'react';
import { Button, Modal } from 'antd';
import { AppImages, ExternalLinks } from '@/constants/LinkAndImageConstants';
import { DownloadOutlined } from '@ant-design/icons';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal open={isOpen} onCancel={onClose} footer={null} width={600}>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="w-full sm:w-auto sm:flex-shrink-0">
          <img
            src={AppImages.WELCOME_IMG}
            alt="Netmaker illustration"
            className="rounded-lg w-full sm:w-auto h-auto aspect-[2/1] sm:aspect-auto object-cover sm:object-none"
          />
        </div>
        <div className="flex flex-col items-center w-full gap-5 p-4 sm:w-auto sm:max-w-xs sm:p-0">
          <h2 className="text-lg">Welcome to Netmaker</h2>
          <p className="text-center text-text-secondary">
            We&apos;re excited to have you on board. To get started, please download our Remote Access Client (RAC) and
            connect to your network with ease.
          </p>
          <Button
            type="primary"
            size="large"
            href={ExternalLinks.RAC_DOWNLOAD_LINK}
            target="_blank"
            rel="noopener noreferrer"
            icon={<DownloadOutlined />}
          >
            Download RAC
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeModal;
