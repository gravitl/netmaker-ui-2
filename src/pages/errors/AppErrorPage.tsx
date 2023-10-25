import { AppRoutes } from '@/routes';
import { fileBugReport, resolveAppRoute } from '@/utils/RouteUtils';
import { Button, Card, Col, Layout, Result, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

interface AppErrorPageProps {
  error: Error;
  info: any;
}

export function AppErrorPage(props: AppErrorPageProps) {
  const navigate = useNavigate();

  return (
    <Layout style={{ position: 'relative', minHeight: '100dvh', justifyContent: 'center', alignItems: 'center' }}>
      <Result
        status="error"
        title="Application crashed"
        subTitle="Sorry, an unexpected error occured."
        extra={
          <>
            {(props.error || props.info) && (
              <Row style={{ marginTop: '4rem' }}>
                <Col span={24} style={{ display: 'flex', justifyContent: 'center' }}>
                  <Card style={{ width: '80%', maxHeight: '40dvh', overflowY: 'auto' }}>
                    <Typography.Text>{String(props.error)}</Typography.Text>
                    <br />
                    <br />
                    <Typography.Text>{JSON.stringify(props.info, null, 4)}</Typography.Text>
                  </Card>
                </Col>
              </Row>
            )}

            <Row gutter={50} style={{ marginTop: '4rem' }}>
              <Col span={12}>
                <Button
                  type="text"
                  size="large"
                  onClick={() => {
                    fileBugReport(`${props.error}\n${JSON.stringify(props.info, null, 4)}`);
                    navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE));
                  }}
                >
                  File a Bug Report
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE))}
                >
                  Back Home
                </Button>
              </Col>
            </Row>
          </>
        }
      />
    </Layout>
  );
}
