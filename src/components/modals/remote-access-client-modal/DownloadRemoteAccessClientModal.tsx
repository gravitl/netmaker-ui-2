import { QuestionCircleOutlined } from '@ant-design/icons';
import '../CustomModal.scss';
import './DownloadRemoteAccessClientModal.scss';
import { Button, Card, Col, Divider, Form, Modal, Row, Select } from 'antd';
import { MouseEvent, useCallback, useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import { AvailableArchs, AvailableOses } from '@/models/AvailableOses';
import { getRACDownloadLink } from '@/utils/RouteUtils';
import { isSaasBuild } from '@/services/BaseService';
import { ServerConfigService } from '@/services/ServerConfigService';

type PageType = 'network-details' | 'host';
interface DownloadRemoteAccessClientModalProps {
  isOpen: boolean;
  onFinish?: () => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  networkId?: string;
  isTourOpen?: boolean;
  tourStep?: number;
  page?: PageType;
}

const RAC_DOCS_URL = 'https://docs.netmaker.io/pro/rac.html';

export default function DownloadRemotesAccessClientModal({ isOpen, onCancel }: DownloadRemoteAccessClientModalProps) {
  const store = useStore();

  const theme = store.currentTheme;
  const [selectedOs, setSelectedOs] = useState<AvailableOses>('windows');
  const [selectedArch, setSelectedArch] = useState<AvailableArchs>('arm64');

  const onShowInstallGuide = useCallback((ev: MouseEvent, os: AvailableOses) => {
    const btnSelector = '.NewHostModal .os-button';
    const activeBtnClass = 'active';
    document.querySelectorAll(btnSelector).forEach((btn) => {
      btn.classList.remove(activeBtnClass);
    });
    (ev.currentTarget as HTMLElement).classList.add(activeBtnClass);
    setSelectedOs(os);
  }, []);

  const resetModal = () => {
    setSelectedOs('windows');
    setSelectedArch('arm64');
  };

  useEffect(() => {
    // reset arch on OS change
    setSelectedArch('arm64');
  }, [selectedOs]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Download Remote Access Client</span>}
      open={isOpen}
      className="CustomModal NewHostModal"
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      style={{ minWidth: '50vw' }}
      footer={null}
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />

      {/* download rac */}
      <div className="CustomModalBody">
        <Row justify="center">
          <Col xs={24}>
            <Card>
              <p>
                Select your OS{' '}
                <Button
                  title="Go to RAC documentation"
                  style={{ marginLeft: '0.2rem' }}
                  href={RAC_DOCS_URL}
                  target="_blank"
                  icon={<QuestionCircleOutlined />}
                />
              </p>

              {/* os selection */}
              <Divider />
              <Row style={{ height: 'auto' }} justify="center" wrap={true}>
                <Col xs={8} md={4} style={{ textAlign: 'center' }}>
                  <div
                    className={`os-button ${selectedOs === 'windows' ? 'active' : ''}`}
                    onClick={(ev) => onShowInstallGuide(ev, 'windows')}
                  >
                    <img
                      src={`${isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''}/icons/windows-${theme}.jpg`}
                      alt="windows icon"
                      className="logo"
                    />
                    <p>Windows</p>
                  </div>
                </Col>
                <Col xs={8} md={4} style={{ textAlign: 'center' }}>
                  <div
                    className={`os-button ${selectedOs === 'macos' ? 'active' : ''}`}
                    onClick={(ev) => onShowInstallGuide(ev, 'macos')}
                  >
                    <img
                      src={`${isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''}/icons/macos-${theme}.jpg`}
                      alt="macos icon"
                      className="logo"
                    />
                    <p>Mac</p>
                  </div>
                </Col>
                <Col xs={8} md={4} style={{ textAlign: 'center' }}>
                  <div
                    className={`os-button ${selectedOs === 'linux' ? 'active' : ''}`}
                    onClick={(ev) => onShowInstallGuide(ev, 'linux')}
                  >
                    <img
                      src={`${isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''}/icons/linux-${theme}.jpg`}
                      alt="linux icon"
                      className="logo"
                    />
                    <p>Linux</p>
                  </div>
                </Col>
              </Row>

              {/* content */}
              <Divider />
              {selectedOs === 'windows' && (
                <>
                  <Row>
                    <Col xs={24} style={{ textAlign: 'center' }}>
                      <Button
                        type="primary"
                        href={getRACDownloadLink('windows', 'amd64')[0]}
                        block
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </Button>
                      <small>Requires Windows 7 SP1 or later</small>
                    </Col>
                  </Row>
                </>
              )}

              {selectedOs === 'macos' && (
                <>
                  <Row>
                    <Col xs={24} style={{ textAlign: 'center' }}>
                      <Form.Item label="Select your architecture">
                        <Select
                          value={selectedArch}
                          onChange={(value) => setSelectedArch(value)}
                          options={[
                            { label: 'Apple Silicon (M1/ARM64)', value: 'arm64' },
                            { label: 'Intel (AMD64)', value: 'amd64' },
                          ]}
                        ></Select>
                      </Form.Item>
                      <Button
                        type="primary"
                        href={getRACDownloadLink('macos', selectedArch)[0]}
                        block
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download for {selectedArch}
                      </Button>
                      <br />
                      <small>Requires Mac OS High Sierra 10.13 or later</small>
                      <div style={{ marginTop: '1rem' }}></div>
                    </Col>
                  </Row>
                </>
              )}

              {selectedOs === 'linux' && (
                <>
                  <Row>
                    <Col xs={24}>
                      {/* <Form.Item label="Select your architecture">
                        <Select
                          value={selectedArch}
                          onChange={(value) => setSelectedArch(value)}
                          options={[{ label: 'AMD64', value: 'amd64' }]}
                        ></Select>
                      </Form.Item> */}
                      {/* <Button
                        type="primary"
                        href={getRACDownloadLink('linux', selectedArch, 'gui')[0]}
                        block
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download Installer
                      </Button>

                      <Divider /> */}
                      <div className="" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Button type="primary" block href={RAC_DOCS_URL} target="_blank" rel="noreferrer">
                          View Docs
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
}
