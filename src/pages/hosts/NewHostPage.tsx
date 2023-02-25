import { CopyOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, Layout, List, Row, Steps } from 'antd';
import { MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageProps } from '../../models/Page';
import { AppRoutes } from '../../routes';

import './NewHostPage.scss';

type AvailableOses = 'windows' | 'macos' | 'linux' | 'freebsd' | 'docker';

const steps = [
  {
    title: 'Select Network',
  },
  {
    title: 'Connect Host',
  },
];

export default function NewHostPage(props: PageProps) {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedOs, setSelectedOs] = useState<AvailableOses>('windows');

  const onStepChange = (newStep: number) => {
    setCurrentStep(newStep);
  };

  const onFinish = () => {
    navigate(AppRoutes.HOST_ROUTE);
  };

  const onShowInstallGuide = (ev: MouseEvent, os: AvailableOses) => {
    const btnSelector = '.NewHostPage .os-button';
    const activeBtnClass = 'active';
    document.querySelectorAll(btnSelector).forEach((btn) => {
      btn.classList.remove(activeBtnClass);
    });
    (ev.currentTarget as HTMLElement).classList.add(activeBtnClass);
    setSelectedOs(os);
  };

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
              <List
                size="small"
                className="networks-list"
                style={{ maxHeight: '50vh', overflow: 'auto', marginTop: '.5rem' }}
              >
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onStepChange(1);
                  }}
                >
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
                  <div className="os-button active" onClick={(ev) => onShowInstallGuide(ev, 'windows')}>
                    <img src="/src/assets/icons/windows.svg" alt="windows icon" className="logo" />
                    <p>Windows</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button" onClick={(ev) => onShowInstallGuide(ev, 'macos')}>
                    <img src="/src/assets/icons/macos.svg" alt="macos icon" className="logo" />
                    <p>Mac</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button" onClick={(ev) => onShowInstallGuide(ev, 'linux')}>
                    <img src="/src/assets/icons/linux.svg" alt="linux icon" className="logo" />
                    <p>Linux</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button" onClick={(ev) => onShowInstallGuide(ev, 'freebsd')}>
                    <img src="/src/assets/icons/freebsd.svg" alt="freebsd icon" className="logo" />
                    <p>FreeBSD</p>
                  </div>
                </Col>
                <Col xs={4} style={{ textAlign: 'center' }}>
                  <div className="os-button" onClick={(ev) => onShowInstallGuide(ev, 'docker')}>
                    <img src="/src/assets/icons/docker.svg" alt="docker icon" className="logo" />
                    <p>Docker</p>
                  </div>
                </Col>
              </Row>

              {/* TODO: implement copy feature */}
              {/* content */}
              <Divider />
              {selectedOs === 'windows' && (
                <>
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
                          defaultValue={
                            '. { iwr -useb  https://raw.githubusercontent.com/gravitl/netmaker/master/scripts/netclient-install.ps1 } | iex; Netclient-Install -version "<your netmaker version>"'
                          }
                        />
                        <Button icon={<CopyOutlined />} />
                      </Input.Group>
                    </Col>
                  </Row>
                </>
              )}

              {selectedOs === 'macos' && (
                <>
                  <Row>
                    <Col xs={24} style={{ textAlign: 'center' }}>
                      <Button
                        type="primary"
                        href="https://fileserver.netmaker.org/latest/darwin/Netclient.pkg"
                        style={{ width: '100%' }}
                      >
                        Download
                      </Button>
                      <small>Requires Mac OS High Sierra 10.13 or later</small>
                    </Col>
                  </Row>
                  <Divider />
                  <Row>
                    <Col xs={24}>
                      <h4 style={{ marginTop: 0 }}>Install with these command(s)</h4>
                      <Input.TextArea
                        rows={3}
                        defaultValue={`brew tap gravitl/netclient\nbrew audit netclient\nbrew install netclient`}
                        disabled
                      />
                    </Col>
                  </Row>
                </>
              )}

              {selectedOs === 'freebsd' && (
                <>
                  <Row>
                    <Col xs={24}>
                      <h4 style={{ marginTop: 0 }}>Install with these command(s)</h4>
                      <Input.Group compact>
                        <Input
                          disabled
                          style={{ width: 'calc(100% - 32px)' }}
                          defaultValue={
                            'curl -sfL https://raw.githubusercontent.com/gravitl/netmaker/master/scripts/netclient-install.sh | VERSION="<your netmaker version>" sh -'
                          }
                        />
                        <Button icon={<CopyOutlined />} />
                      </Input.Group>
                    </Col>
                  </Row>
                </>
              )}

              {selectedOs === 'docker' && (
                <>
                  <Row>
                    <Col xs={24}>
                      <h4 style={{ marginTop: 0 }}>Check the docs for installation steps</h4>
                      <Button
                        style={{ width: '100%' }}
                        type="primary"
                        href="https://docs.netmaker.org/netclient.html#docker"
                        target="_blank"
                      >
                        Go to Docs
                      </Button>
                    </Col>
                  </Row>
                </>
              )}

              {selectedOs === 'linux' && (
                <>
                  <Row>
                    <Col xs={24}>
                      <h4 style={{ marginTop: 0 }}>Check the docs for installation steps</h4>
                      <Button
                        style={{ width: '100%' }}
                        type="primary"
                        href="https://docs.netmaker.org/netclient.html#linux"
                        target="_blank"
                      >
                        Go to Docs
                      </Button>
                    </Col>
                  </Row>
                </>
              )}
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
