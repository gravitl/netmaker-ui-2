import { Col, ConfigProvider, Modal, Row, theme, Typography } from 'antd';
import { MouseEvent } from 'react';
import '../CustomModal.scss';
import './VersionUpgradeModal.styles.scss';
import { CloudSyncOutlined } from '@ant-design/icons';
import { useStore } from '@/store/store';
import { isSaasBuild } from '@/services/BaseService';

const UPGRADE_DOCS_LINK = 'https://docs.netmaker.io/upgrades.html';

interface VersionUpgradeModalProps {
  isOpen: boolean;
  latestNetmakerVersion: string;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function VersionUpgradeModal({ isOpen, onCancel, latestNetmakerVersion }: VersionUpgradeModalProps) {
  const store = useStore();

  return (
    // TODO: find a way to DRY the theme config provider
    <ConfigProvider
      theme={{
        algorithm: store.currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Modal
        open={!isSaasBuild && isOpen}
        onCancel={onCancel}
        footer={null}
        centered
        closable
        className="VersionUpgradeModal"
      >
        <Row style={{ marginTop: '1rem' }}>
          <Col span={24}>
            <CloudSyncOutlined twoToneColor="#D89614" size={800} style={{ color: '#D89614', fontSize: '3rem' }} />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Typography.Title level={4}>New server version available</Typography.Title>
          </Col>
          <Col span={24}>
            <Typography.Text>Follow the below steps to upgrade</Typography.Text>
            <ol>
              <li>
                <Typography.Text>Connect to your server</Typography.Text>
              </li>
              <li>
                <Typography.Text>
                  Update the following lines in the <Typography.Text code>netmaker.env</Typography.Text> file
                </Typography.Text>
                <br />
                <pre className="code-bg">
                  {`SERVER_IMAGE_TAG=${latestNetmakerVersion}
UI_IMAGE_TAG=${latestNetmakerVersion.replace('-ee', '')}`}
                </pre>
              </li>
              <li>
                <Typography.Text>
                  Restart the server with{' '}
                  <Typography.Text code copyable>
                    docker-compose down
                  </Typography.Text>{' '}
                  then{' '}
                  <Typography.Text code copyable>
                    docker-compose up -d
                  </Typography.Text>
                </Typography.Text>
              </li>
            </ol>
            <br />
            <Typography.Text>
              Running into issues? Read our{' '}
              <a href={UPGRADE_DOCS_LINK} rel="noreferrer" target="_blank">
                upgrade documentation
              </a>{' '}
              for more information on upgrades
            </Typography.Text>
          </Col>
        </Row>
      </Modal>
    </ConfigProvider>
  );
}
