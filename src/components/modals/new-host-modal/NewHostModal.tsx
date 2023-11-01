import { ArrowLeftOutlined, ArrowRightOutlined, SearchOutlined } from '@ant-design/icons';
import '../CustomModal.scss';
import './NewHostModal.scss';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Steps,
  Table,
  Typography,
  notification,
} from 'antd';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import { AvailableArchs, AvailableOses } from '@/models/AvailableOses';
import { getNetclientDownloadLink } from '@/utils/RouteUtils';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { isEnrollmentKeyValid } from '@/utils/EnrollmentKeysUtils';
import AddEnrollmentKeyModal from '../add-enrollment-key-modal/AddEnrollmentKeyModal';
import { isSaasBuild } from '@/services/BaseService';
import { ServerConfigService } from '@/services/ServerConfigService';
import { getExtendedNode } from '@/utils/NodeUtils';
import { ExtendedNode } from '@/models/Node';
import { NULL_NODE, NULL_NODE_ID } from '@/constants/Types';

interface NewHostModal {
  isOpen: boolean;
  onFinish?: () => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  networkId?: string;
}

const steps = [
  {
    title: 'Select an Enrollment Key',
  },
  {
    title: 'Install Netclient',
  },
  {
    title: 'Join Network',
  },
];

export default function NewHostModal({ isOpen, onCancel, onFinish, networkId }: NewHostModal) {
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();

  const theme = store.currentTheme;
  const [currentStep, setCurrentStep] = useState(0);
  const [keySearch, setKeySearch] = useState('');
  const [selectedOs, setSelectedOs] = useState<AvailableOses>('windows');
  const [selectedArch, setSelectedArch] = useState<AvailableArchs>('amd64');
  const [enrollmentKeys, setEnrollmentKeys] = useState<EnrollmentKey[]>([]);
  const [selectedEnrollmentKey, setSelectedEnrollmentKey] = useState<EnrollmentKey | null>(null);
  const [isAddEnrollmentKeyModalOpen, setIsAddEnrollmentKeyModalOpen] = useState(false);

  const filteredEnrollmentKeys = useMemo(
    () =>
      enrollmentKeys
        .filter((key) => isEnrollmentKeyValid(key))
        .filter((key) =>
          `${key.tags.join('')}${key.networks.join('')}`.toLowerCase().includes(keySearch.toLocaleLowerCase()),
        ),
    [enrollmentKeys, keySearch],
  );

  const isOnLastStep = useMemo(() => {
    if (currentStep >= 2) return true;
    return false;
  }, [currentStep]);

  const onStepChange = useCallback((newStep: number) => {
    // TODO: add step validation
    setCurrentStep(newStep);
  }, []);

  const onShowInstallGuide = useCallback((ev: MouseEvent, os: AvailableOses) => {
    const btnSelector = '.NewHostModal .os-button';
    const activeBtnClass = 'active';
    document.querySelectorAll(btnSelector).forEach((btn) => {
      btn.classList.remove(activeBtnClass);
    });
    (ev.currentTarget as HTMLElement).classList.add(activeBtnClass);
    setSelectedOs(os);
  }, []);

  const loadEnrollmentKeys = useCallback(async () => {
    try {
      const keys = (await EnrollmentKeysService.getEnrollmentKeys()).data;

      if (networkId) {
        const filteredKeys = keys.filter((key) => key.networks.includes(networkId));
        setEnrollmentKeys(filteredKeys);
        return;
      }

      setEnrollmentKeys(keys);
    } catch (err) {
      notify.error({
        message: 'Failed to load enrollment keys',
        description: extractErrorMsg(err as any),
      });
      console.error(err);
    }
  }, [notify, networkId]);

  const resetModal = () => {
    setCurrentStep(0);
    setIsAddEnrollmentKeyModalOpen(false);
    setSelectedEnrollmentKey(null);
    setSelectedOs('windows');
    setSelectedArch('amd64');
  };

  const relayNode = useMemo<ExtendedNode>(() => {
    // check if enrollment key is for relay node
    if (selectedEnrollmentKey?.relay != NULL_NODE_ID) {
      const relayNode = store.nodes
        .map((node) => getExtendedNode(node, store.hostsCommonDetails))
        .find((node) => node.id === selectedEnrollmentKey?.relay);
      if (relayNode) {
        return relayNode;
      }
    }
    return NULL_NODE;
  }, [selectedEnrollmentKey, store.nodes, store.hostsCommonDetails]);

  useEffect(() => {
    // reset arch on OS change
    setSelectedArch('amd64');
  }, [selectedOs]);

  useEffect(() => {
    loadEnrollmentKeys();
  }, [loadEnrollmentKeys]);

  return (
    <Modal
      title={<span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add a new host</span>}
      open={isOpen}
      className="CustomModal NewHostModal"
      onCancel={(ev) => {
        resetModal();
        onCancel?.(ev);
      }}
      style={{ minWidth: '50vw' }}
      footer={
        currentStep > 0 ? (
          <div className="CustomModalBody">
            <Row>
              <Col xs={24}>
                <Button onClick={() => onStepChange(currentStep - 1)}>
                  <ArrowLeftOutlined /> Back
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    if (isOnLastStep) {
                      notify.success({
                        message: 'Host added successfully',
                        description: 'It might take a moment to reflect...',
                      });
                      resetModal();
                      onFinish?.();
                    } else onStepChange(currentStep + 1);
                  }}
                >
                  {isOnLastStep ? (
                    'Finish'
                  ) : (
                    <>
                      Next <ArrowRightOutlined />
                    </>
                  )}
                </Button>
              </Col>
            </Row>
          </div>
        ) : (
          <></>
        )
      }
    >
      <Divider style={{ margin: '0px 0px 2rem 0px' }} />

      <div className="CustomModalBody">
        <Row justify="center" style={{ marginBottom: '1rem' }}>
          <Col xs={24}>
            <Steps size="small" current={currentStep} items={steps} />
          </Col>
        </Row>
      </div>

      {/* choose a key */}
      {currentStep === 0 && (
        <div className="CustomModalBody">
          <Row justify="center">
            <Col xs={24}>
              <Card>
                <p style={{ marginTop: '0' }}>Select an enrollment key to register with</p>
                <div className="" style={{ textAlign: 'right' }}>
                  <Button size="small" type="link" onClick={() => setIsAddEnrollmentKeyModalOpen(true)}>
                    Create new Key
                  </Button>
                </div>
                <Input
                  size="small"
                  placeholder="Search keys"
                  onChange={(ev) => setKeySearch(ev.target.value)}
                  prefix={<SearchOutlined />}
                />
                <Table
                  style={{ marginTop: '1rem' }}
                  size="small"
                  pagination={{
                    pageSize: 5,
                  }}
                  columns={[
                    {
                      title: 'Name',
                      render(_, key: EnrollmentKey) {
                        return key.tags.join(', ');
                      },
                      sorter(a, b) {
                        return a.tags.join(', ').localeCompare(b.tags.join(', '));
                      },
                      defaultSortOrder: 'ascend',
                    },
                    {
                      title: 'Networks',
                      render(_, key: EnrollmentKey) {
                        return key.networks.join(', ');
                      },
                    },
                  ]}
                  dataSource={filteredEnrollmentKeys}
                  rowKey="value"
                  onRow={(key) => ({
                    onClick: () => {
                      setSelectedEnrollmentKey(key);
                      onStepChange(1);
                    },
                  })}
                  rowClassName={(key) => {
                    return key.value === selectedEnrollmentKey?.value ? 'selected-row' : '';
                  }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* install netclient */}
      {currentStep === 1 && (
        <div className="CustomModalBody">
          <Row justify="center">
            <Col xs={24}>
              {selectedEnrollmentKey?.relay != NULL_NODE_ID && (
                <Alert
                  style={{ marginBottom: '1rem' }}
                  type="warning"
                  message={`This enrollment key is for a relay node named ${relayNode.name}. Your host will automatically be relayed`}
                  showIcon
                />
              )}
              <Card>
                <p>
                  Connect host to network(s){' '}
                  <span style={{ fontWeight: 'bold' }}>{selectedEnrollmentKey?.networks.join(', ')}</span> via key{' '}
                  <span style={{ fontWeight: 'bold' }}>&quot;{selectedEnrollmentKey?.tags.join(', ')}&quot;</span>{' '}
                  <Button type="link" size="small" onClick={() => setCurrentStep(0)}>
                    Change
                  </Button>
                </p>

                {/* os selection */}
                <Divider />
                <Row style={{ height: '4rem' }} justify="center">
                  <Col xs={4} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'windows' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'windows')}
                    >
                      <img
                        src={`${
                          isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''
                        }/icons/windows-${theme}.jpg`}
                        alt="windows icon"
                        className="logo"
                      />
                      <p>Windows</p>
                    </div>
                  </Col>
                  <Col xs={4} style={{ textAlign: 'center' }}>
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
                  <Col xs={4} style={{ textAlign: 'center' }}>
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
                  <Col xs={4} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${
                        selectedOs === 'freebsd13' || selectedOs === 'freebsd14' ? 'active' : ''
                      }`}
                      onClick={(ev) => onShowInstallGuide(ev, 'freebsd13')}
                    >
                      <img
                        src={`${
                          isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''
                        }/icons/freebsd-${theme}.jpg`}
                        alt="freebsd icon"
                        className="logo"
                      />
                      <p>FreeBSD</p>
                    </div>
                  </Col>
                  <Col xs={4} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'docker' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'docker')}
                    >
                      <img
                        src={`${isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''}/icons/docker-${theme}.jpg`}
                        alt="docker icon"
                        className="logo"
                      />
                      <p>Docker</p>
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
                          href={getNetclientDownloadLink('windows', 'amd64')[0]}
                          block
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </Button>
                        <small>Requires Windows 7 SP1 or later</small>
                        <div style={{ marginTop: '1rem' }}>
                          <Typography.Text style={{ fontWeight: 'bold' }}>
                            Note: Run the installer before proceeding
                          </Typography.Text>
                        </div>
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
                              { label: 'Intel (AMD64)', value: 'amd64' },
                              { label: 'Apple Silicon (M1/ARM64)', value: 'arm64' },
                            ]}
                          ></Select>
                        </Form.Item>
                        <Button
                          type="primary"
                          href={getNetclientDownloadLink('macos', selectedArch)[0]}
                          block
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download for {selectedArch}
                        </Button>
                        <br />
                        <small>Requires Mac OS High Sierra 10.13 or later</small>
                        <div style={{ marginTop: '1rem' }}>
                          <Typography.Text style={{ fontWeight: 'bold' }}>
                            Note: Run the installer before proceeding
                          </Typography.Text>
                        </div>
                      </Col>
                    </Row>
                  </>
                )}

                {selectedOs === 'linux' && (
                  <>
                    <Row>
                      <Col xs={24}>
                        <Form.Item label="Select your architecture">
                          <Select
                            value={selectedArch}
                            onChange={(value) => setSelectedArch(value)}
                            options={[
                              { label: 'AMD64', value: 'amd64' },
                              { label: 'ARM64', value: 'arm64' },
                              { label: 'ARMv7', value: 'armv7' },
                              { label: 'ARMv6', value: 'armv6' },
                              { label: 'ARMv5', value: 'armv5' },
                              { label: 'MIPS-HARDFLOAT', value: 'mips-hardfloat' },
                              { label: 'MIPS-SOFTFLOAT', value: 'mips-softfloat' },
                              { label: 'MIPSLE-HARDFLOAT', value: 'mipsle-hardfloat' },
                              { label: 'MIPSLE-SOFTFLOAT', value: 'mipsle-softfloat' },
                            ]}
                          ></Select>
                        </Form.Item>
                        <h4 style={{ marginBottom: '.5rem' }}>Install with this command</h4>
                        <Typography.Text code copyable>
                          {`wget -O netclient ${
                            getNetclientDownloadLink('linux', selectedArch, 'cli')[0]
                          } && chmod +x ./netclient && sudo ./netclient install`}
                        </Typography.Text>
                        <Divider />
                        <div className="" style={{ marginTop: '1rem', textAlign: 'center' }}>
                          <Button
                            type="link"
                            href={getNetclientDownloadLink('linux', selectedArch, 'gui')[0]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download GUI
                          </Button>
                          <Button
                            type="link"
                            href="https://docs.netmaker.io/netclient.html#linux"
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Docs
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </>
                )}

                {(selectedOs === 'freebsd13' || selectedOs === 'freebsd14') && (
                  <>
                    <Row>
                      <Col xs={24}>
                        <h4 style={{ marginBottom: '.5rem' }}>Install with this command</h4>
                        <Typography.Title level={5}>FreeBSD 13</Typography.Title>
                        <Typography.Text code copyable>
                          {`fetch -o /tmp/netclient ${
                            getNetclientDownloadLink('freebsd13', 'amd64', 'cli')[0]
                          } && chmod +x /tmp/netclient && sudo /tmp/netclient install`}
                        </Typography.Text>
                        <br />
                        <Typography.Title level={5}>FreeBSD 14</Typography.Title>
                        <Typography.Text code copyable>
                          {`fetch -o /tmp/netclient ${
                            getNetclientDownloadLink('freebsd14', 'amd64', 'cli')[0]
                          } && chmod +x /tmp/netclient && sudo /tmp/netclient install`}
                        </Typography.Text>
                      </Col>
                    </Row>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* join network */}
      {currentStep === 2 && (
        <div className="CustomModalBody">
          <Row justify="center">
            <Col xs={24}>
              <Card>
                <Typography.Text>Steps to join a network:</Typography.Text>
                {(selectedOs === 'windows' || selectedOs === 'macos') && (
                  <div>
                    <ol>
                      <li>Open Netclient GUI</li>
                      <li>Select &quot;Add New Network&quot;</li>
                      <li>Click Join via Enrollemnt Key</li>
                      <li>
                        Enter{' '}
                        <Typography.Text code copyable>
                          {`${selectedEnrollmentKey?.token ?? '<token>'}`}
                        </Typography.Text>{' '}
                        as enrollment key
                      </li>
                      <li>Click Submit and Get connected :)</li>
                    </ol>
                    <small>Note: It might take a few minutes for the host to show up in the network(s)</small>
                  </div>
                )}
                {selectedOs === 'linux' && (
                  <div>
                    <ol>
                      <li>
                        <Typography.Text>Run</Typography.Text>
                        <Typography.Text code copyable>
                          {`sudo netclient join -t ${`${selectedEnrollmentKey?.token ?? '<token>'}`}`}
                        </Typography.Text>
                      </li>
                    </ol>
                    <small>Note: It might take a few minutes for the host to show up in the network(s)</small>
                  </div>
                )}
                {(selectedOs === 'freebsd13' || selectedOs === 'freebsd14') && (
                  <div>
                    <ol>
                      <li>
                        <Typography.Text>Run</Typography.Text>
                        <Typography.Text code copyable>
                          {`sudo /tmp/netclient join -t ${`${selectedEnrollmentKey?.token ?? '<token>'}`}`}
                        </Typography.Text>
                      </li>
                    </ol>
                    <small>Note: It might take a few minutes for the host to show up in the network(s)</small>
                  </div>
                )}

                {selectedOs === 'docker' && (
                  <div>
                    <ol>
                      <li>
                        <Typography.Text>Run</Typography.Text>
                        <Typography.Text code copyable>
                          {`sudo docker run -d --network host --privileged -e TOKEN=${selectedEnrollmentKey?.token} -v /etc/netclient:/etc/netclient --name netclient gravitl/netclient:${
                            store.serverConfig?.Version ?? '<version>'
                          }`}
                        </Typography.Text>
                      </li>
                      <li>
                        <Typography.Text>Compose</Typography.Text>
                        <Typography.Text code copyable>
                          {`
version: '3.7'
services:
  netclient:
    image: gravitl/netclient:${store.serverConfig?.Version ?? '<version>'}
    network_mode: host
    privileged: true
    environment:
      - TOKEN=${selectedEnrollmentKey?.token}
    volumes:
      - /etc/netclient:/etc/netclient
`}
                        </Typography.Text>
                      </li>
                    </ol>
                    <small>Note: It might take a few minutes for the host to show up in the network(s)</small>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* misc */}
      {notifyCtx}
      <AddEnrollmentKeyModal
        isOpen={isAddEnrollmentKeyModalOpen}
        onCreateKey={(key) => {
          setEnrollmentKeys([...enrollmentKeys, key]);
          setSelectedEnrollmentKey(key);
          setIsAddEnrollmentKeyModalOpen(false);
        }}
        onCancel={() => {
          setIsAddEnrollmentKeyModalOpen(false);
        }}
        networkId={networkId}
      />
    </Modal>
  );
}
