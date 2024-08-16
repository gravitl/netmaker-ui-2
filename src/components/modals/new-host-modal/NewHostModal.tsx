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
  QRCode,
  Row,
  Select,
  Steps,
  Table,
  Typography,
  notification,
} from 'antd';
import { MouseEvent, Ref, useCallback, useEffect, useMemo, useState } from 'react';
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
import { useBranding } from '@/utils/Utils';
import { useTheme } from 'antd-style';

type PageType = 'network-details' | 'host';
interface NewHostModal {
  isOpen: boolean;
  onFinish?: (selectedOs?: AvailableOses) => void;
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
  networkId?: string;
  connectHostModalEnrollmentKeysTabRef?: Ref<HTMLDivElement>;
  connectHostModalSelectOSTabRef?: Ref<HTMLDivElement>;
  connectHostModalJoinNetworkTabRef?: Ref<HTMLDivElement>;
  isTourOpen?: boolean;
  tourStep?: number;
  page?: PageType;
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

const appleStoreLink = 'https://apps.apple.com/us/app/netmaker-rac/id6479694220?itsct=apps_box_badge&amp;itscg=30200';
const playStoreLink =
  'https://play.google.com/store/apps/details?id=com.net.netmaker&pli=1&utm_source=nmui&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1';

export default function NewHostModal({
  isOpen,
  onCancel,
  onFinish,
  networkId,
  connectHostModalEnrollmentKeysTabRef,
  connectHostModalJoinNetworkTabRef,
  connectHostModalSelectOSTabRef,
  isTourOpen,
  tourStep,
  page,
}: NewHostModal) {
  const store = useStore();
  const [notify, notifyCtx] = notification.useNotification();
  const branding = useBranding();
  const antdTheme = useTheme();

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
      enrollmentKeys &&
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

  const handleTourStepChange = useMemo(() => {
    if (
      (page === 'host' && isTourOpen && tourStep === 7) ||
      (page === 'network-details' && isTourOpen && tourStep === 4)
    ) {
      setSelectedEnrollmentKey(enrollmentKeys[0]);
      setCurrentStep(1);
    } else if (
      (page === 'host' && isTourOpen && tourStep === 8) ||
      (page === 'network-details' && isTourOpen && tourStep === 5)
    ) {
      setSelectedOs('linux');
      setCurrentStep(2);
    }
  }, [isTourOpen, tourStep]);

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
                      if (selectedOs !== 'mobile') {
                        notify.success({
                          message: 'Host added successfully',
                          description: 'It might take a moment to reflect...',
                        });
                      }
                      resetModal();
                      onFinish?.(selectedOs);
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
            <Col xs={24} ref={connectHostModalEnrollmentKeysTabRef}>
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
                <div className="table-wrapper">
                  <Table
                    style={{ marginTop: '1rem' }}
                    size="small"
                    pagination={{
                      pageSize: 5,
                    }}
                    columns={[
                      {
                        title: 'Available Keys',
                        render(_, key: EnrollmentKey) {
                          return <a href="#">{key.tags.join(', ')}</a>;
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
                    rowSelection={{
                      type: 'checkbox',
                      hideSelectAll: true,
                      selectedRowKeys: selectedEnrollmentKey ? [selectedEnrollmentKey.value] : [],
                      onSelect: (record) => {
                        if (selectedEnrollmentKey?.value === record.value) {
                          setSelectedEnrollmentKey(null);
                        } else {
                          setSelectedEnrollmentKey(record);
                          onStepChange(1);
                        }
                      },
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* install netclient */}
      {currentStep === 1 && (
        <div className="CustomModalBody">
          <Row justify="center" ref={connectHostModalSelectOSTabRef}>
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
                <Row style={{ height: 'auto' }} justify="center" wrap={true}>
                  <Col xs={8} md={4} lg={3} style={{ textAlign: 'center' }}>
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
                  <Col xs={8} md={4} lg={3} style={{ textAlign: 'center' }}>
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
                  <Col xs={8} md={4} lg={3} style={{ textAlign: 'center' }}>
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
                  <Col xs={8} md={4} lg={3} style={{ textAlign: 'center' }}>
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
                  <Col xs={8} md={4} lg={3} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'mobile' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'mobile')}
                    >
                      <img
                        src={`${isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''}/icons/mobile-${theme}.png`}
                        alt="mobile icon"
                        className="logo"
                      />
                      <p>Mobile</p>
                    </div>
                  </Col>
                  <Col xs={8} md={4} lg={3} style={{ textAlign: 'center' }}>
                    <div
                      className={`os-button ${selectedOs === 'other' ? 'active' : ''}`}
                      onClick={(ev) => onShowInstallGuide(ev, 'other')}
                    >
                      <img
                        src={`${
                          isSaasBuild ? `/${ServerConfigService.getUiVersion()}` : ''
                        }/icons/others-icon-${theme}.png`}
                        alt="others icon"
                        className="logo"
                      />
                      <p>Others</p>
                    </div>
                  </Col>
                </Row>

                {/* content */}
                <Divider />
                {selectedOs === 'windows' && (
                  <>
                    <Row>
                      <Col xs={24} style={{ textAlign: 'center' }}>
                        <Alert
                          type="info"
                          message={
                            <>
                              We recommend using the remote access client for Windows. Go to remote access tab and you
                              can follow the instructions for setup
                              <a href="https://docs.netmaker.io/pro/rac.html" target="_blank" rel="noreferrer">
                                {' '}
                                here.
                              </a>
                            </>
                          }
                          style={{ marginBottom: '0.5rem' }}
                        />
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
                        <Alert
                          type="info"
                          message={
                            <>
                              We recommend using the remote access client for Mac. Go to remote access tab and you can
                              follow the instructions for setup
                              <a href="https://docs.netmaker.io/pro/rac.html" target="_blank" rel="noreferrer">
                                {' '}
                                here.
                              </a>
                            </>
                          }
                          style={{ marginBottom: '0.5rem' }}
                        />
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
                            getNetclientDownloadLink('linux', selectedArch)[0]
                          } && chmod +x ./netclient && sudo ./netclient install`}
                        </Typography.Text>
                        <Divider />
                        <div className="" style={{ marginTop: '1rem', textAlign: 'center' }}>
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

                {selectedOs === 'docker' && (
                  <>
                    <Row>
                      <Col xs={24}>
                        <h4 style={{ marginBottom: '.5rem' }}>Installation steps on next page</h4>
                      </Col>
                    </Row>
                  </>
                )}

                {selectedOs === 'mobile' && (
                  <>
                    <Row>
                      <Col xs={24}>
                        <h4 style={{ marginBottom: '.5rem' }}>Install our remote access client for mobile devices</h4>
                        <Typography.Paragraph>
                          Easily connect to your {branding.productName} network with our mobile application.
                        </Typography.Paragraph>
                      </Col>
                      <Col xs={12} style={{ textAlign: 'start' }}>
                        <QRCode value={playStoreLink} />
                        <Typography.Paragraph style={{ marginTop: '1rem' }}>
                          or download from store
                        </Typography.Paragraph>
                        <a href={playStoreLink} target="_blank" rel="noreferrer">
                          <img
                            alt="Get Reomte Access Client on Google Play"
                            src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                            style={{ width: '13rem', height: '5rem', marginRight: '2rem' }}
                          />
                        </a>
                      </Col>
                      <Col
                        xs={12}
                        style={{
                          textAlign: 'start',
                          borderLeft: `1px solid ${antdTheme.colorBorder}`,
                          paddingLeft: '1rem',
                        }}
                      >
                        <QRCode value={appleStoreLink} />
                        <Typography.Paragraph style={{ marginTop: '1rem' }}>
                          or download from store
                        </Typography.Paragraph>
                        <a href={appleStoreLink} target="_blank" rel="noreferrer">
                          <img
                            src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83&amp;releaseDate=1711670400"
                            alt="Download Remote Access Client on the App Store"
                            style={{ borderRadius: '8px', width: '10rem', height: '5rem' }}
                          />
                        </a>
                      </Col>
                    </Row>
                  </>
                )}

                {selectedOs === 'other' && (
                  <>
                    <Row>
                      <Col xs={24}>
                        <h4 style={{ marginBottom: '.5rem' }}>Installation steps on next page</h4>
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
          <Row justify="center" ref={connectHostModalJoinNetworkTabRef}>
            <Col xs={24}>
              <Card>
                <Typography.Text>Steps to join a network:</Typography.Text>
                {(selectedOs === 'linux' || selectedOs === 'windows' || selectedOs === 'macos') && (
                  <div>
                    <ol>
                      <li>
                        <Typography.Text>Run (with admin priviledges)</Typography.Text>
                        <Typography.Text code copyable>
                          {`netclient join -t ${`${selectedEnrollmentKey?.token ?? '<token>'}`}`}
                        </Typography.Text>
                      </li>
                    </ol>
                    <small>Note: It might take a few minutes for the host to show up in the network(s)</small>
                  </div>
                )}

                {selectedOs === 'other' && (
                  <div style={{ marginTop: '10px' }}>
                    <Typography.Text>
                      Any device that supports WireGuard can be integrated into your network using a Client Config file
                      with the Remote Access Gateway. Follow this guide to set up the Remote Access Gateway and generate
                      a Client Config file for your device, which can be run with WireGuard
                    </Typography.Text>
                    <ul>
                      <li>
                        <a
                          href="https://docs.netmaker.io/external-clients.html#remote-access"
                          target="_blank"
                          rel="noreferrer"
                        >
                          General setup
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://docs.netmaker.io/integrating-non-native-devices.html"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Routers
                        </a>
                      </li>
                    </ul>
                  </div>
                )}

                {selectedOs === 'mobile' && (
                  <div style={{ marginTop: '10px' }}>
                    <ol>
                      <li>Create a remote access gateway (if you haven&apos;t already).</li>
                      <li>
                        Attach users to the gateway. This is to provide controlled access to your network. Admin users
                        will be able to connect to any gateway.
                      </li>
                      <li>Open RAC on your mobile and login with the attached user account.</li>
                      <li>Select the network/gateway you wish to connect to and tap on &ldquo;Connect&rdquo;</li>
                    </ol>

                    <Typography.Text>
                      Visit the docs on how to{' '}
                      <a
                        href="https://docs.netmaker.io/pro/pro-users.html#attaching-or-removing-user-from-a-remote-access-gateway"
                        target="_blank"
                        rel="noreferrer"
                      >
                        attach a user to a remote access gateway
                      </a>{' '}
                      or how to connect your mobile device to the network with the{' '}
                      <a href="https://docs.netmaker.io/pro/rac.html" target="_blank" rel="noreferrer">
                        Remote Access Client (RAC)
                      </a>
                      .
                    </Typography.Text>
                  </div>
                )}

                {selectedOs === 'docker' && (
                  <div>
                    <ul>
                      <li>
                        <Typography.Title level={5}>Docker</Typography.Title>
                        <Typography.Text>Run</Typography.Text>
                        <Typography.Text code copyable>
                          {`sudo docker run -d --network host --privileged -e TOKEN=${selectedEnrollmentKey?.token} -v /etc/netclient:/etc/netclient --name netclient gravitl/netclient:${
                            store.serverConfig?.Version ?? '<version>'
                          }`}
                        </Typography.Text>
                      </li>
                      <li>
                        <Typography.Title level={5}>Docker Compose</Typography.Title>
                        <pre className="code-bg">
                          {`services:
  netclient:
    image: gravitl/netclient:${store.serverConfig?.Version ?? '<version>'}
    network_mode: host
    privileged: true
    environment:
      - TOKEN=${selectedEnrollmentKey?.token}
    volumes:
      - /etc/netclient:/etc/netclient
`}
                        </pre>
                      </li>
                    </ul>
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
        key={`add-enrollment-key-${networkId}`}
        isOpen={isAddEnrollmentKeyModalOpen}
        onCreateKey={(key) => {
          setEnrollmentKeys([...enrollmentKeys, key]);
          setSelectedEnrollmentKey(key);
          setIsAddEnrollmentKeyModalOpen(false);
          onStepChange(1);
        }}
        onCancel={() => {
          setIsAddEnrollmentKeyModalOpen(false);
        }}
        networkId={networkId}
      />
    </Modal>
  );
}
