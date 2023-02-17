import { Button, Col, Layout, Row, Steps } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../routes';

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

  const [currentStep, setCurrentStep] = useState(0);

  const onNextStep = () => {
    const maxNumOfStepsIndex = gettingStartedSteps.length - 1;
    // if on last step
    if (currentStep === maxNumOfStepsIndex) {
      navigate(AppRoutes.HOME_ROUTE);
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const onPrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Layout>
      <Content>
        <Row style={{ height: '100vh' }} align="middle">
          <Col xs={24} md={16} style={{ textAlign: 'center' }}>
            <h3>{gettingStartedSteps[currentStep]?.label ?? ''}</h3>
            <p>{gettingStartedSteps[currentStep]?.desc ?? ''}</p>
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
          <Col xs={0} md={8} style={{ backgroundColor: 'white', height: '100%' }}></Col>
        </Row>
      </Content>
    </Layout>
  );
}
