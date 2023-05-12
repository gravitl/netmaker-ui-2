import { ArrowLeftOutlined, ArrowRightOutlined, PlusOutlined } from '@ant-design/icons';
import '../CustomModal.scss';
import './NewHostModal.scss';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  List,
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
import AddNetworkModal from '../add-network-modal/AddNetworkModal';
import { Network } from '@/models/Network';
import { AvailableArchs, AvailableOses } from '@/models/AvailableOses';
import { getNetclientDownloadLink } from '@/utils/RouteUtils';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { isEnrollmentKeyValid } from '@/utils/EnrollmentKeysUtils';
import AddEnrollmentKeyModal from '../add-enrollment-key-modal/AddEnrollmentKeyModal';

interface NewHostModal {
  isOpen: boolean;
  preferredNetwork?: Network;
  onFinish?: () => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
}

const steps = [
  {
    title: 'Select Network',
  },
  {
    title: 'Install Netclient',
  },
  {
    title: 'Join Network',
  },
];

export default function NewHostModal({ isOpen, preferredNetwork, onCancel, onFinish }: NewHostModal) {
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();

  const theme = store.currentTheme;
  const [currentStep, setCurrentStep] = useState(0);
  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [networkSearch, setNetworkSearch] = useState('');
  const [selectedOs, setSelectedOs] = useState<AvailableOses>('windows');
  const [selectedArch, setSelectedArch] = useState<AvailableArchs>('amd64');
  const [enrollmentKeys, setEnrollmentKeys] = useState<EnrollmentKey[]>([]);
  const [selectedEnrollmentKey, setSelectedEnrollmentKey] = useState<EnrollmentKey | null>(null);
  const [isAddEnrollmentKeyModalOpen, setIsAddEnrollmentKeyModalOpen] = useState(false);

  const filteredEnrollmentKeys = useMemo(
    () => enrollmentKeys.filter((key) => isEnrollmentKeyValid(key)),
    [enrollmentKeys]
  );

  const isOnLastStep = useMemo(() => {
    if (currentStep >= 2) return true;
    else if (currentStep === 1 && selectedOs === 'docker') return true;
    return false;
  }, [currentStep, selectedOs]);

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
      setEnrollmentKeys(keys);
    } catch (err) {
      notify.error({
        message: 'Failed to load enrollment keys',
        description: extractErrorMsg(err as any),
      });
      console.error(err);
    }
  }, [notify]);

  const resetModal = () => {
    setCurrentStep(0);
    setIsAddEnrollmentKeyModalOpen(false);
    setIsAddNetworkModalOpen(false);
    setSelectedEnrollmentKey(null);
    setSelectedNetwork(null);
    setSelectedOs('windows');
    setSelectedArch('amd64');
  };

  useEffect(() => {
    // autoselect network
    if (preferredNetwork) {
      setSelectedNetwork(preferredNetwork);
      onStepChange(1);
    } else if (store.networks.length === 1) {
      setSelectedNetwork(store.networks[0]);
      onStepChange(1);
    }
  }, [onStepChange, preferredNetwork, store.networks]);

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

      {/* choose network */}
      {currentStep === 0 && (
        <div className="CustomModalBody">
          <Row justify="center">
            <Col xs={24}>
              <Card>
                <p style={{ marginTop: '0' }}>Select a network to join</p>
                <Input
                  placeholder="Search network"
                  value={networkSearch}
                  onChange={(ev) => setNetworkSearch(ev.target.value)}
                />
                <List
                  size="small"
                  className="networks-list"
                  style={{ maxHeight: '40vh', overflow: 'auto', marginTop: '.5rem' }}
                >
                  {store.networks
                    .filter((network) => network.netid.includes(networkSearch.toLocaleLowerCase()))
                    .sort((a, b) => a.netid.localeCompare(b.netid))
                    .map((network) => (
                      <List.Item
                        key={network.netid}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedNetwork(network);
                          onStepChange(1);
                        }}
                      >
                        <List.Item.Meta
                          style={{ cursor: 'pointer' }}
                          title={network.netid}
                          description={`IPv4 Range: ${network.addressrange}${
                            network.isipv6 ? ', IPv6 Range: ' + network.addressrange6 : ''
                          }`}
                        />
                      </List.Item>
                    ))}
                </List>
                <Button type="link" style={{ marginTop: '1rem' }} onClick={() => setIsAddNetworkModalOpen(true)}>
                  <PlusOutlined /> Add network
                </Button>
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
              <Card>
                <p>
                  Connect host to{' '}
                  <span style={{ fontWeight: 'bold' }}>
                    {selectedNetwork?.netid} ({`${selectedNetwork?.addressrange}, ${selectedNetwork?.addressrange6}`})
                  </span>{' '}
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
                      <img src={`/icons/windows-${theme}.jpg`} alt="windows icon" className="logo" />
                      <p>Windows</p>
                    </div>
                  </Col>
                  <Col xs={4} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'macos' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'macos')}
                    >
                      <img src={`/icons/macos-${theme}.jpg`} alt="macos icon" className="logo" />
                      <p>Mac</p>
                    </div>
                  </Col>
                  <Col xs={4} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'linux' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'linux')}
                    >
                      <img src={`/icons/linux-${theme}.jpg`} alt="linux icon" className="logo" />
                      <p>Linux</p>
                    </div>
                  </Col>
                  <Col xs={4} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'freebsd' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'freebsd')}
                    >
                      <img src={`/icons/freebsd-${theme}.jpg`} alt="freebsd icon" className="logo" />
                      <p>FreeBSD</p>
                    </div>
                  </Col>
                  <Col xs={4} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'docker' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'docker')}
                    >
                      <img src={`/icons/docker-${theme}.jpg`} alt="docker icon" className="logo" />
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
                          href={getNetclientDownloadLink('windows', 'amd64')[0]}
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
                        <small>Requires Mac OS High Sierra 10.13 or later</small>
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
                        <Button
                          block
                          type="primary"
                          href={getNetclientDownloadLink('linux', selectedArch, 'cli')[0]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download CLI for {selectedArch}
                        </Button>
                        <h4>Install with this command</h4>
                        <Typography.Text code copyable>{`sudo chmod +x ./${
                          getNetclientDownloadLink('linux', selectedArch, 'cli')[1]
                        } && sudo ./${
                          getNetclientDownloadLink('linux', selectedArch, 'cli')[1]
                        } install`}</Typography.Text>
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
                            href="https://docs.netmaker.org/netclient.html#linux"
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

                {selectedOs === 'freebsd' && (
                  <>
                    <Row>
                      <Col xs={24}>
                        <Button
                          block
                          type="primary"
                          href={getNetclientDownloadLink('freebsd', 'amd64', 'cli')[0]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </Button>
                        <h4>Install with this command</h4>
                        <Typography.Text code copyable>{`sudo chmod +x ./${
                          getNetclientDownloadLink('freebsd', 'amd64', 'cli')[1]
                        } && sudo ./${
                          getNetclientDownloadLink('freebsd', 'amd64', 'cli')[1]
                        } install`}</Typography.Text>
                      </Col>
                    </Row>
                  </>
                )}

                {selectedOs === 'docker' && (
                  <>
                    <Row>
                      <Col xs={24}>
                        <div className="" style={{ textAlign: 'right' }}>
                          <Button size="small" type="link" onClick={() => setIsAddEnrollmentKeyModalOpen(true)}>
                            Create new Key
                          </Button>
                        </div>
                        <Table
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
                            },
                          })}
                          rowClassName={(key) => {
                            return key.value === selectedEnrollmentKey?.value ? 'selected-row' : '';
                          }}
                        />

                        {selectedEnrollmentKey && (
                          <>
                            <Typography.Title level={5} style={{ marginTop: '0rem' }}>
                              Join network({selectedEnrollmentKey.networks.join(', ')}) with the below command:
                            </Typography.Title>
                            <Typography.Text code copyable>
                              {`sudo docker run -d --network host --privileged -e TOKEN=${
                                selectedEnrollmentKey.token
                              } -v /etc/netclient:/etc/netclient --name netclient gravitl/netclient: ${
                                store.serverConfig?.Version ?? '<version>'
                              }`}
                            </Typography.Text>
                          </>
                        )}
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
                      <li>Click Join via SSO</li>
                      <li>Enter &quot;{store.serverConfig?.APIHost ?? '<server name>'}&quot; as server name</li>
                      <li>Enter &quot;{selectedNetwork?.netid ?? '<network name>'}&quot; as network</li>
                      <li>Login and get connected :)</li>
                    </ol>
                  </div>
                )}

                {(selectedOs === 'linux' || selectedOs === 'freebsd') && (
                  <div>
                    <Typography.Text>Run</Typography.Text>
                    <Typography.Text code copyable>
                      netclient join -s {store.serverConfig?.APIHost ?? '<server name>'} -n{' '}
                      {selectedNetwork?.netid ?? '<network name>'}
                    </Typography.Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* misc */}
      {notifyCtx}
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={() => {
          setIsAddNetworkModalOpen(false);
        }}
        onCancel={() => {
          setIsAddNetworkModalOpen(false);
        }}
      />
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
      />
    </Modal>
  );
}
