import { useState, useEffect } from 'react';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { CloseCircleFilled, DownloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { NMUI_SHOW_RAC_BANNER_LOCALSTORAGE_KEY } from '@/services/BaseService';

const RacDownloadBanner = () => {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const storedValue = localStorage.getItem(NMUI_SHOW_RAC_BANNER_LOCALSTORAGE_KEY);
    if (storedValue !== null) {
      setShowBanner(JSON.parse(storedValue));
    }
  }, []);

  const handleClose = () => {
    setShowBanner(false);
    localStorage.setItem(NMUI_SHOW_RAC_BANNER_LOCALSTORAGE_KEY, JSON.stringify(false));
  };

  if (!showBanner) return null;

  return (
    <div className="flex items-start w-full gap-4 p-5 mb-6 border rounded-xl bg-bg-contrastDefault border-stroke-default">
      <span className="flex items-center justify-center w-12 h-10 border rounded-lg border-stroke-default">
        <DownloadOutlined />
      </span>
      <div className="flex flex-col w-full gap-2">
        <h3 className="text-text-primary text-base-semibold">Get Connected with RAC</h3>
        <p className="text-base text-text-secondary">
          Download the Remote Access Client (RAC) to securely connect to your Netmaker network from any device. <br />
          Compatible with Windows, Mac, Linux, Android, and iOS.
        </p>
      </div>
      <div className="flex flex-col items-end justify-between h-full">
        <CloseCircleFilled onClick={handleClose} style={{ cursor: 'pointer' }} />
        <Button
          href={ExternalLinks.RAC_DOWNLOAD_LINK}
          target="_blank"
          rel="noreferrer"
          type="primary"
          icon={<DownloadOutlined />}
          style={{
            marginLeft: 'auto',
          }}
        >
          {' '}
          Download RAC
        </Button>
      </div>
    </div>
  );
};

export default RacDownloadBanner;
