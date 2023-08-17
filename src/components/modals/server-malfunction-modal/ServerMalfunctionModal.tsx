import { Button, Col, Collapse, CollapseProps, ConfigProvider, Modal, Row, theme, Typography } from 'antd';
import { Fragment, MouseEvent, useMemo } from 'react';
import '../CustomModal.scss';
import { useTranslation } from 'react-i18next';
import { ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useStore } from '@/store/store';
import { getAmuiUrl, getLicenseDashboardUrl, getNetmakerSupportEmail } from '@/utils/RouteUtils';
import { isSaasBuild } from '@/services/BaseService';

interface ServerMalfunctionModalProps {
  isOpen: boolean;
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

type ServerMalfunctionType = 'billing' | 'db' | 'broker' | 'network';

export default function ServerMalfunctionModal({ isOpen, onCancel }: ServerMalfunctionModalProps) {
  const { t } = useTranslation();
  const store = useStore();

  const getServerMalfunctions = useMemo(() => {
    const malfunctions: ServerMalfunctionType[] = [];

    if (store.serverStatus?.status?.license_error) {
      malfunctions.push('billing');
    }
    if (!store.serverStatus?.status?.db_connected) {
      malfunctions.push('db');
    }
    if (!store.serverStatus?.status?.broker_connected) {
      malfunctions.push('broker');
    }
    if (!store.serverStatus?.status?.healthyNetwork) {
      malfunctions.push('network');
    }

    return malfunctions;
  }, [store.serverStatus]);

  const reasons = useMemo<CollapseProps['items']>(() => {
    const reasons: CollapseProps['items'] = [];

    if (getServerMalfunctions.includes('billing')) {
      reasons.push({
        key: 'billing',
        label: `${reasons.length + 1}. Billing Issues`,
        children: (
          <>
            {t('error.checkbillingsetting')}{' '}
            <a href={getLicenseDashboardUrl()} rel="noreferrer" referrerPolicy="no-referrer" target="_blank">
              {t('common.licensedashboard')}
            </a>
            . Also check your Netmaker server logs for detailed information.
          </>
        ),
      });
    }
    if (getServerMalfunctions.includes('db')) {
      reasons.push({
        key: 'db',
        label: `${reasons.length + 1}. Database Reachability Issues`,
        children: (
          <>
            The server is not able to connect to the database. Check your Netmaker server config logs for detailed
            information.
          </>
        ),
      });
    }
    if (getServerMalfunctions.includes('broker')) {
      reasons.push({
        key: 'broker',
        label: `${reasons.length + 1}. Broker Reachability Issues`,
        children: (
          <>
            The server is not able to connect to the message broker. Check your Netmaker server config logs for detailed
            information.
          </>
        ),
      });
    }
    if (getServerMalfunctions.includes('network')) {
      reasons.push({
        key: 'network',
        label: `${reasons.length + 1}. Network Connectivity Issues`,
        children: (
          <>
            The dashboard is not able to connect to your Netmaker server. Check your network connection, SSL certificate
            or DNS settings for your tenant.
          </>
        ),
      });
    }

    return reasons;
  }, [getServerMalfunctions, t]);

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

        <Row>
          <Col span={24}>
            <Typography.Title level={4}>Netmaker is not functioning properly</Typography.Title>
          </Col>
          <Col span={24}>
            <Typography.Text strong>
              Contact your server admin, check your network settings or{' '}
              <a href={`mailto:${getNetmakerSupportEmail()}`} target="_blank" rel="noreferrer">
                email us
              </a>
            </Typography.Text>
          </Col>

          <Col span={24} style={{ marginTop: '1rem' }}>
            <Typography.Text>Possible reasons:</Typography.Text>
            <br />
            <Collapse size="small" defaultActiveKey={[]} ghost items={reasons} />
            {isSaasBuild && (
              <Fragment>
                <br />
                <Button type="primary" size="small" href={getAmuiUrl()}>
                  Go to Account Management
                </Button>
              </Fragment>
            )}
          </Col>

          <Col span={24} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <Typography.Text>Dashboard will become responsive once the issue(s) is resolved</Typography.Text>
            <LoadingOutlined />
          </Col>
        </Row>
      </Modal>
    </ConfigProvider>
  );
}
