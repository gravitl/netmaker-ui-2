import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/store/store';
import { Button, Col, Row, Typography, Tabs, TabsProps } from 'antd';
import { InformationCircleIcon, ChartBarSquareIcon } from '@heroicons/react/24/solid';
import PageLayout from '@/layouts/PageLayout';
import NetworkMetricsPage from '../metrics/NetworkMetricsPage';
import NetworkInfoPage from '../info/NetworkInfoPage';
import { useQuery } from '@/utils/RouteUtils';

export const AnalyticsPageTabs = {
  metricsTabKey: 'metrics',
  infoTabKey: 'info',
};

const defaultTabKey = AnalyticsPageTabs.metricsTabKey;

const NetworkAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState(defaultTabKey);
  const { networkId } = useParams<{ networkId: string }>();
  const store = useStore();
  const queryParams = useQuery();
  const resolvedNetworkId = networkId || store.activeNetwork;

  const analyticsTabs: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: AnalyticsPageTabs.metricsTabKey,
        label: 'Metrics',
        children: <NetworkMetricsPage networkId={resolvedNetworkId} isFullScreen={true} />,
      },
      {
        key: AnalyticsPageTabs.infoTabKey,
        label: 'Network Info',
        children: <NetworkInfoPage networkId={resolvedNetworkId} isFullScreen={true} />,
      },
    ];
  }, [resolvedNetworkId]);

  useEffect(() => {
    queryParams.get('tab') && setActiveTab(queryParams.get('tab') as string);
  }, [queryParams]);

  return (
    <PageLayout
      title="Analytics"
      isFullScreen
      description={
        <>
          Monitor and analyze your network performance with detailed metrics and information.
          <br />
          Track connectivity, latency, throughput, and manage network configurations all in one place.
        </>
      }
      icon={<ChartBarSquareIcon className="size-5" />}
    >
      <div className="w-full">
        <Row justify="space-between">
          <Col xs={24}>
            <Tabs
              defaultActiveKey={defaultTabKey}
              items={analyticsTabs}
              activeKey={activeTab}
              onChange={(tabKey: string) => {
                setActiveTab(tabKey);
              }}
            />
          </Col>
        </Row>
      </div>
    </PageLayout>
  );
};

export default NetworkAnalyticsPage;
