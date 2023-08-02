import { Col, ConfigProvider, Modal, Row, theme, Typography } from 'antd';
import { MouseEvent } from 'react';
import '../CustomModal.scss';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useStore } from '@/store/store';
import { getLicenseDashboardUrl, getNetmakerSupportEmail } from '@/utils/RouteUtils';

interface ServerMalfunctionModalProps {
  isOpen: boolean;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function ServerMalfunctionModal({ isOpen, onCancel }: ServerMalfunctionModalProps) {
  const { t } = useTranslation();
  const store = useStore();

  return (
    // TODO: find a way to DRY the theme config provider
    <ConfigProvider
      theme={{
        algorithm: store.currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Modal open={isOpen} onCancel={onCancel} footer={null} centered closable={false}>
        <Row style={{ marginTop: '1rem' }}>
          <Col span={24}>
            <ExclamationCircleOutlined
              twoToneColor="#D89614"
              size={800}
              style={{ color: '#D89614', fontSize: '3rem' }}
            />
          </Col>
        </Row>

        {store.serverStatus?.status?.license_error && (
          <Row>
            <Col span={24}>
              <Typography.Title level={4}>{t('error.billingerroroccured')}</Typography.Title>
              <Typography.Text strong>
                {t('error.checkbillingsetting')}{' '}
                <a href={getLicenseDashboardUrl()} rel="noreferrer" referrerPolicy="no-referrer" target="_blank">
                  {t('common.licensedashboard')}
                </a>
              </Typography.Text>
            </Col>
            <Col span={24} style={{ marginTop: '2rem' }}>
              <Typography.Text>
                {t('common.reason')}: {store.serverStatus?.status?.license_error ?? ''}
              </Typography.Text>
              <br />
              <Typography.Text>
                You can reach out to support at{' '}
                <a href={`mailto:${getNetmakerSupportEmail()}`}>{getNetmakerSupportEmail()}</a>
              </Typography.Text>
            </Col>
          </Row>
        )}
        {!store.serverStatus?.status?.license_error && (
          <Row>
            <Col span={24}>
              <Typography.Title level={4}>{t('error.servermalfunction')}</Typography.Title>
            </Col>
            <Col span={24}>
              <Typography.Text strong>{t('error.contactyourserveradmin')}</Typography.Text>
            </Col>
            <Col span={24} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <Typography.Text>Dashboard will become responsive once the server is stable</Typography.Text>
              <LoadingOutlined />
            </Col>
          </Row>
        )}
      </Modal>
    </ConfigProvider>
  );
}
