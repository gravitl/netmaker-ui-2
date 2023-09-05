import { Button, Col, Layout, Row, Steps, Typography } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../routes';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { resolveAppRoute } from '@/utils/RouteUtils';

const { Content } = Layout;

const gettingStartedSteps = [
  {
    position: 0,
    label: 'Feel powerful',
    desc: 'Few things make me feel more powerful than setting up automations in Untitled to make my life easier and more efficient.',
  },
  {
    position: 1,
    label: 'Feel more powerful',
    desc: 'Few things make me feel more powerful than setting up automations in Untitled to make my life easier and more efficient.',
  },
  {
    position: 2,
    label: 'Feel most powerful',
    desc: 'Few things make me feel more powerful than setting up automations in Untitled to make my life easier and more efficient.',
  },
];

export default function GettingStartedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState(0);

  const onNextStep = () => {
    const maxNumOfStepsIndex = gettingStartedSteps.length - 1;
    // if on last step
    if (currentStep === maxNumOfStepsIndex) {
      navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE));
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const onPrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <AppErrorBoundary key={location.pathname}>
      <Layout>
        <Content>
          <Row style={{ height: '100vh' }} align="middle">
            <Col xs={24} md={16} style={{ textAlign: 'center' }}>
              <Typography.Title level={4}>{gettingStartedSteps[currentStep]?.label ?? ''}</Typography.Title>
              <Typography.Text>
                <p>{gettingStartedSteps[currentStep]?.desc ?? ''}</p>
              </Typography.Text>
              <Row justify="center">
                <Col>
                  <Steps
                    type="inline"
                    current={gettingStartedSteps[currentStep].position}
                    items={gettingStartedSteps as any}
                  />
                </Col>
                <Col style={{ textAlign: 'right' }}>
                  <Button type="link" onClick={onPrevStep} disabled={currentStep === 0}>
                    Back
                  </Button>
                  <Button type="default" onClick={onNextStep}>
                    {currentStep < gettingStartedSteps.length - 1 ? 'Next' : 'Finish'}
                  </Button>
                </Col>
              </Row>
            </Col>
            <Col
              xs={0}
              md={8}
              style={{
                backgroundColor: '#141413',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexFlow: 'column nowrap',
                gap: '1rem',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img src="/icons/hello-loading.gif" alt="loading" style={{ width: '10rem', height: '10rem' }} />
              <Typography.Text style={{ color: 'white' }}>Your instance is being prepared...</Typography.Text>
            </Col>
          </Row>
        </Content>
      </Layout>
    </AppErrorBoundary>
  );
}
