import { CopyOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, Layout, List, Row, Steps, Typography } from 'antd';
import { useState } from 'react';
import { Page } from '../models/Page';
import './NewHostPage.scss';

type AvailableOses = 'windows' | 'mac' | 'linux' | 'freebsd' | 'docker';

const steps = [
  {
    title: 'Select Network',
  },
  {
    title: 'Connect Host',
  },
];

export default function NewHostPage(props: Page) {
  const [currentStep, setCurrentStep] = useState(0);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedOs, setSelectedOs] = useState<AvailableOses>('windows');

  const onStepChange = (newStep: number) => {
    setCurrentStep(newStep);
  };

  const onFinish = () => {};

  if (networks.length === 1) {
    setSelectedNetwork(networks[0]);
  }

  return (
    <Layout.Content
      className="NewHostPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24, paddingTop: '4rem' }}
    >
      <Row justify="center" style={{ marginBottom: '1rem' }}>
        <Col xs={24} md={12}>
          <Steps size="small" current={currentStep} items={steps} onChange={onStepChange} />
        </Col>
      </Row>

      {/* select network */}
      {currentStep === 0 && (
        <Row justify="center">
          <Col xs={24} lg={12}>
            <Card>
              <p style={{ marginTop: '0' }}>Select a network</p>
              <Input placeholder="Search network..." />
              <List size="small" style={{ maxHeight: '50vh', overflow: 'auto', marginTop: '.5rem' }}>
                <List.Item>
                  <List.Item.Meta title="Network 1" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title="Network 2" description="123.123.123.0/24, abc9::/8" />
                </List.Item>
              </List>
              <Button type="link">
                <PlusOutlined /> Add network
              </Button>
            </Card>
          </Col>
        </Row>
      )}

      {/* host setup guide */}
      {currentStep === 1 && (
        <Row justify="center">
          <Col xs={24} lg={12}>
            <Card>
              <p>
                Connect host to <span style={{ fontWeight: 'bold' }}>Network 1 (123.123.123.0/24, abc9::/8)</span>{' '}
                <Button type="link" size="small" onClick={() => setCurrentStep(0)}>
                  Change
                </Button>
              </p>

              {/* os selection */}
              <Divider />
              <Row style={{ height: '4rem' }} justify="center">
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_503_48520)">
                        <path d="M0 3.75V11.25H10.5V2.4375L0 3.75Z" fill="white" />
                        <path d="M12 2.25V11.25H24V0.75L12 2.25Z" fill="white" />
                        <path d="M12 12.75V21.75L24 23.25V12.75H12Z" fill="white" />
                        <path d="M0 12.75V20.25L10.5 21.5625V12.75H0Z" fill="white" />
                      </g>
                      <defs>
                        <clipPath id="clip0_503_48520">
                          <rect width="24" height="24" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>

                    <p>Windows</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button">
                    <div className="logo"></div>
                    <p>Mac</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button">
                    <div className="logo"></div>
                    <p>Linux</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button">
                    <div className="logo"></div>
                    <p>FreeBSD</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button">
                    <div className="logo"></div>
                    <p>Docker</p>
                  </div>
                </Col>
              </Row>

              {/* content */}
              <Divider />
              <Row>
                <Col xs={24} style={{ textAlign: 'center' }}>
                  <Button
                    type="primary"
                    href="https://fileserver.netmaker.org/latest/windows/netclient_x86.msi"
                    style={{ width: '100%' }}
                  >
                    Download
                  </Button>
                  <small>Requires Windows 7 SP1 or later</small>
                </Col>
              </Row>
              <Divider />
              <Row>
                <Col xs={24}>
                  <h4 style={{ marginTop: 0 }}>Install with Powershell</h4>
                  <Input.Group compact>
                    <Input
                      disabled
                      style={{ width: 'calc(100% - 32px)' }}
                      defaultValue="git@github.com:ant-design/ant-design.git"
                    />
                    {/* <Tooltip title="copy git url"> */}
                    <Button icon={<CopyOutlined />} />
                    {/* </Tooltip> */}
                  </Input.Group>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      <Layout.Footer style={{ position: 'absolute', bottom: '0', width: '100%' }}>
        <Row justify="center">
          <Col xs={24} lg={12} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button type="link" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep <= 0}>
              Previous
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button type="primary" onClick={onFinish}>
                Finish
              </Button>
            ) : (
              <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            )}
          </Col>
        </Row>
      </Layout.Footer>
    </Layout.Content>
  );
}
