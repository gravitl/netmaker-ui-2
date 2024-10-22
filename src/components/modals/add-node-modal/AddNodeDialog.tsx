import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDownIcon,
  CommandLineIcon,
  DocumentIcon,
  PlusIcon,
  ServerIcon,
  UserIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/solid';
import { getNetclientDownloadLink, getRACDownloadLink } from '@/utils/RouteUtils';
import { useStore } from '@/store/store';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { Row, Col, QRCode, Typography } from 'antd';
import { useBranding } from '@/utils/Utils';
import { useTheme } from 'antd-style';
import { Link } from 'react-router-dom';
import windowsIconSrc from '../../../../public/icons/windows.svg';
import macIconSrc from '../../../../public/icons/apple.svg';
import linuxIconSrc from '../../../../public/icons/linux.svg';
import dockerIconSrc from '../../../../public/icons/docker.svg';
import ConfigFileTab from './ConfigFileTab';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';

const ManageUsersSection = () => {
  return (
    <div className="flex flex-col items-start gap-2 px-8 py-6 ">
      <div className="flex items-center gap-2 text-text-primary">
        <UsersIcon className="w-4 h-4" />
        <h3 className="text-sm-semibold">Manage Users</h3>
      </div>
      <p className="text-text-secondary">To manage users you can do it from User Management.</p>
      <Link to={'/users'} target="_blank">
        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded text-text-secondary bg-button-plain-fill-default">
          <UsersIcon className="w-4 h-4" />
          <span className="text-sm-semibold">Manage Users</span>
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
};

const CopyableCodeTag = ({ code }: { code: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative w-full px-4 py-3 overflow-x-auto rounded-lg bg-bg-hover">
      <code className="block min-w-0 break-words whitespace-pre-wrap rounded text-sm-semibold text-text-primary">
        {code}
      </code>
      <button
        onClick={copyToClipboard}
        className="absolute z-50 p-1 transition-colors duration-200 rounded-md text-text-primary bg-bg-contrastDefault top-2 right-2 hover:bg-bg-contrastHover group-hover:opacity-100"
        aria-label="Copy to clipboard"
      >
        {isCopied ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4 " />}
      </button>
    </div>
  );
};

const NetclientSection: React.FC<{
  netclientOS: string;
  setNetclientOS: (os: string) => void;
  netclientOSSteps: any[];
  netclientOSOptions: {
    name: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconSrc?: string;
  }[];
}> = ({ netclientOS, setNetclientOS, netclientOSSteps, netclientOSOptions }) => {
  const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [linuxInstallCode, setLinuxInstallCode] = useState<string>('');

  const antdTheme = useTheme();
  const store = useStore();

  const updateLinuxInstallCode = useCallback(
    (version: string) => {
      const baseUrl = `https://fileserver.netmaker.io/releases/download/${store.serverConfig?.Version}`;
      const newCode = `wget -O netclient ${baseUrl}/netclient-linux-${version} && chmod +x ./netclient && sudo ./netclient install`;
      setLinuxInstallCode(newCode);
    },
    [store.serverConfig?.Version],
  );

  const getDownloadLink = useCallback((instruction: any, selectedVersion: string) => {
    if (instruction.versions) {
      const versionInfo = instruction.versions.find((v: any) => v.version === selectedVersion);
      if (versionInfo) {
        return versionInfo.link;
      }
    }
    return instruction.CTALink;
  }, []);

  const handleVersionSelect = (os: string, version: string) => {
    setSelectedVersions((prev) => ({ ...prev, [os]: version }));
    if (os === 'Linux') {
      updateLinuxInstallCode(version);
    } else {
      const currentStep = netclientOSSteps.find((step) => step[os]);
      if (currentStep) {
        const instruction = currentStep[os][0];
        if (instruction.CTA || instruction.CTALink) {
          setDownloadLink(getDownloadLink(instruction, version));
        }
      }
    }
  };

  useEffect(() => {
    const updateVersionsAndLink = () => {
      setSelectedVersions((prevSelectedVersions) => {
        const newSelectedVersions = { ...prevSelectedVersions };
        let hasChanges = false;

        netclientOSSteps.forEach((step) => {
          const os = Object.keys(step)[0];
          const instructions = step[os];

          instructions.forEach((instruction: any, index: number) => {
            if (index === 0 && instruction.versions && instruction.versions.length > 0 && !prevSelectedVersions[os]) {
              newSelectedVersions[os] = instruction.versions[0].version;
              hasChanges = true;
            }
            if (os === netclientOS) {
              if (os === 'Linux') {
                updateLinuxInstallCode(newSelectedVersions[os] || 'amd64');
              } else if (instruction.CTA || instruction.CTALink) {
                setDownloadLink(getDownloadLink(instruction, newSelectedVersions[os]));
              }
            }
          });
        });

        return hasChanges ? newSelectedVersions : prevSelectedVersions;
      });
    };

    updateVersionsAndLink();
  }, [netclientOS, netclientOSSteps, updateLinuxInstallCode, getDownloadLink]);
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 px-8 py-6 border-b border-stroke-default">
        <div className="flex items-center gap-2 text-text-primary">
          <CommandLineIcon className="w-4 h-4" />
          <h3 className="text-sm-semibold">Connect via Netclient</h3>
        </div>
        <p className="text-text-secondary">Select your OS and follow the installation instructions.</p>
        <div className="flex">
          <div className="flex">
            {netclientOSOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => setNetclientOS(option.name)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-200 ${
                  netclientOS === option.name
                    ? 'bg-button-secondary-fill-default text-text-primary'
                    : 'bg-transparent text-text-secondary hover:bg-button-secondary-fill-hover'
                }`}
              >
                {option.iconSrc ? (
                  <img src={option.iconSrc} alt={`${option.name} icon`} className="w-4 h-4" />
                ) : option.iconSrc ? (
                  <option className="flex-shrink-0 w-4 h-4 text-text-primary" />
                ) : null}
                <span className="whitespace-nowrap">{option.name}</span>
              </button>
            ))}
          </div>{' '}
        </div>
        <div className="flex flex-col gap-7 mt-7">
          {netclientOSSteps
            .filter((step) => step[netclientOS])
            .map((step) =>
              step[netclientOS].map((instruction: any, index: number) => (
                <div key={index} className="flex w-full gap-3">
                  <h5 className="flex items-center justify-center w-6 h-6 border rounded-full text-sm-semibold text-text-secondary bg-bg-hover border-stroke-default">
                    {index + 1}
                  </h5>
                  <div className="flex flex-col items-start w-full gap-2">
                    <h4 className="text-base-semibold text-text-primary">{instruction.title}</h4>
                    {instruction.description && (
                      <p className="text-base-semibold text-text-secondary">{instruction.description}</p>
                    )}
                    {netclientOS === 'Linux' && index === 0 && (
                      <div className="relative">
                        <select
                          onChange={(e) => handleVersionSelect('Linux', e.target.value)}
                          value={selectedVersions['Linux'] || 'amd64'}
                          className="px-4 py-2 pr-8 text-sm leading-tight border rounded-lg appearance-none text-text-primary bg-bg-default border-stroke-default focus:outline-none focus:border-blue-500"
                        >
                          <option className="text-text-primary" value="amd64">
                            AMD64
                          </option>
                          <option value="arm64" className="text-text-primary">
                            ARM64
                          </option>
                          <option value="armv7" className="text-text-primary">
                            ARMv7
                          </option>
                          <option value="armv6" className="text-text-primary">
                            ARMv6
                          </option>
                          <option value="armv5" className="text-text-primary">
                            ARMv5
                          </option>
                          <option value="mips-hardfloat" className="text-text-primary">
                            MIPS-HARDFLOAT
                          </option>
                          <option value="mips-softfloat" className="text-text-primary">
                            MIPS-SOFTFLOAT
                          </option>
                          <option value="mipsle-hardfloat" className="text-text-primary">
                            MIPSLE-HARDFLOAT
                          </option>
                          <option value="mipsle-softfloat" className="text-text-primary">
                            MIPSLE-SOFTFLOAT
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-text-secondary">
                          <ChevronDownIcon className="w-4 h-4" />
                        </div>
                      </div>
                    )}

                    {netclientOS !== 'Linux' && instruction.versions && instruction.versions.length > 0 && (
                      <div className="relative">
                        <select
                          onChange={(e) => handleVersionSelect(netclientOS, e.target.value)}
                          value={selectedVersions[netclientOS] || instruction.versions[0].version}
                          className="px-4 py-2 pr-8 text-sm leading-tight border rounded-lg appearance-none text-text-primary bg-bg-default border-stroke-default focus:outline-none focus:border-blue-500"
                        >
                          {instruction.versions.map((version: any, idx: number) => (
                            <option className="text-text-primary" key={idx} value={version.version}>
                              {version.version}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-text-secondary">
                          <ChevronDownIcon className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                    {netclientOS === 'Linux' && index === 0 ? (
                      <CopyableCodeTag code={linuxInstallCode} />
                    ) : netclientOS === 'Linux' && index === 1 ? (
                      <CopyableCodeTag code={instruction.Code} />
                    ) : instruction.CTA || instruction.CTALink ? (
                      <a
                        href={downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-sm font-semibold text-white rounded-lg bg-button-primary-fill-default hover:bg-button-primary-fill-hover"
                      >
                        {instruction.CTA || 'Download'}
                      </a>
                    ) : null}
                    {instruction.Code && netclientOS !== 'Linux' && <CopyableCodeTag code={instruction.Code} />}
                    {netclientOS === 'Mobile' && (
                      <>
                        <Row>
                          <Col xs={12} style={{ textAlign: 'start' }}>
                            <Typography.Paragraph style={{ marginTop: '1rem' }}>Android</Typography.Paragraph>
                            <QRCode value={ExternalLinks.PLAY_STORE_LINK} />
                            <Typography.Paragraph style={{ marginTop: '1rem' }}>
                              Or download from store
                            </Typography.Paragraph>
                            <a href={ExternalLinks.PLAY_STORE_LINK} target="_blank" rel="noreferrer">
                              <img
                                alt="Get Remote Access Client on Google Play"
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
                            <Typography.Paragraph style={{ marginTop: '1rem' }}>iOS</Typography.Paragraph>

                            <QRCode value={ExternalLinks.APPLE_STORE_LINK} />
                            <Typography.Paragraph style={{ marginTop: '1rem' }}>
                              Or download from store
                            </Typography.Paragraph>
                            <a href={ExternalLinks.APPLE_STORE_LINK} target="_blank" rel="noreferrer">
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
                  </div>
                </div>
              )),
            )}
        </div>
      </div>
      {/* {(netclientOS === 'Linux' || netclientOS === 'Docker') && <EgressSection />} */}
    </div>
  );
};

const ActiveUsersSection: React.FC<{
  RACOsSelected: string;
  setRACOsSelected: (os: string) => void;
  RACOSSteps: any[];
}> = ({ RACOsSelected, setRACOsSelected, RACOSSteps }) => {
  const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});
  const [downloadLink, setDownloadLink] = useState<string>('');

  const RACOsOptions = [
    { name: 'Windows', iconSrc: windowsIconSrc },
    { name: 'Mac', iconSrc: macIconSrc },
    { name: 'Linux', iconSrc: linuxIconSrc },
  ];
  const updateDownloadLink = (os: string, version: string) => {
    if (os === 'Windows') {
      setDownloadLink(getRACDownloadLink('windows', 'amd64')[0]);
    } else if (os === 'Mac') {
      setDownloadLink(getRACDownloadLink('macos', version.toLowerCase().includes('arm') ? 'arm64' : 'amd64')[0]);
    }
  };

  const handleVersionSelect = (os: string, version: string) => {
    setSelectedVersions((prev) => ({ ...prev, [os]: version }));
    updateDownloadLink(os, version);
  };

  useEffect(() => {
    const updateVersionsAndLink = () => {
      const newSelectedVersions = { ...selectedVersions };

      RACOSSteps.forEach((step) => {
        const os = Object.keys(step)[0];
        const instructions = step[os];

        instructions.forEach((instruction: any) => {
          if (instruction.versions && instruction.versions.length > 0 && !selectedVersions[os]) {
            newSelectedVersions[os] = instruction.versions[0].version;
          }
          if (os === RACOsSelected) {
            updateDownloadLink(os, newSelectedVersions[os]);
          }
        });
      });

      setSelectedVersions(newSelectedVersions);
    };

    updateVersionsAndLink();
  }, [RACOsSelected, RACOSSteps, selectedVersions]);

  return (
    <div className="flex flex-col gap-2 ">
      <div className="flex flex-col gap-2 px-8 py-6 border-b border-stroke-default ">
        <div className="flex items-center gap-2 text-text-primary">
          <CommandLineIcon className="w-4 h-4" />
          <h3 className="text-sm-semibold">Connect via Remote Access Client</h3>
        </div>
        <p className="text-text-secondary">
          Select your OS and follow the instructions to connect using Remote Access Client.
        </p>
        <div className="flex">
          {RACOsOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => setRACOsSelected(option.name)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-200 ${
                RACOsSelected === option.name
                  ? 'bg-button-secondary-fill-default text-text-primary'
                  : 'bg-transparent text-text-secondary hover:bg-button-secondary-fill-hover'
              }`}
            >
              {option.iconSrc && <img src={option.iconSrc} alt={`${option.name} icon`} className="w-4 h-4" />}
              <span className="whitespace-nowrap">{option.name}</span>
            </button>
          ))}
        </div>{' '}
        <div className="flex flex-col gap-7 mt-7">
          {RACOsSelected === 'Linux' ? (
            <div className="flex flex-col items-start gap-2">
              <h4 className="text-base-semibold text-text-primary">Install on Linux</h4>
              <p className="text-base-semibold text-text-secondary">
                For Linux installations, please refer to our documentation for detailed instructions.
              </p>
              <a
                href={ExternalLinks.RAC_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 text-sm font-semibold text-white rounded-lg bg-button-primary-fill-default hover:bg-button-primary-fill-hover"
              >
                View Linux RAC Documentation
              </a>
            </div>
          ) : (
            RACOSSteps.filter((step) => step[RACOsSelected]).map((step) =>
              step[RACOsSelected].map((instruction: any, index: number) => (
                <div key={index} className="flex w-full gap-3">
                  <h5 className="flex items-center justify-center w-6 h-6 border rounded-full text-sm-semibold text-text-secondary bg-bg-hover border-stroke-default">
                    {index + 1}
                  </h5>
                  <div className="flex flex-col items-start w-full gap-2">
                    <h4 className="text-base-semibold text-text-primary">{instruction.title}</h4>
                    {Array.isArray(instruction.description) ? (
                      <ul className="pl-5 list-disc text-base-semibold text-text-secondary">
                        {instruction.description.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : instruction.description ? (
                      <p className="text-base-semibold text-text-secondary">{instruction.description}</p>
                    ) : null}
                    {instruction.versions && (
                      <div className="relative">
                        <select
                          onChange={(e) => handleVersionSelect(RACOsSelected, e.target.value)}
                          value={selectedVersions[RACOsSelected] || instruction.versions[0].version}
                          className="px-4 py-2 pr-8 text-sm leading-tight border rounded-lg appearance-none text-text-primary bg-bg-default border-stroke-default focus:outline-none focus:border-blue-500"
                        >
                          {instruction.versions.map((version: any, idx: number) => (
                            <option key={idx} value={version.version} className="text-text-primary">
                              {version.version}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-text-secondary">
                          <ChevronDownIcon className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                    {instruction.Code && <CopyableCodeTag code={instruction.Code} />}
                    {instruction.CTA && (
                      <a
                        href={downloadLink || instruction.CTALink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-sm font-semibold text-white rounded-lg bg-button-primary-fill-default hover:bg-button-primary-fill-hover"
                      >
                        {instruction.CTA}
                      </a>
                    )}
                  </div>
                </div>
              )),
            )
          )}
        </div>
      </div>
      <ManageUsersSection />
    </div>
  );
};

const AddNodeDialog: React.FC<{ isOpen: boolean; onClose: () => void; networkId: string }> = ({
  isOpen,
  onClose,
  networkId,
}) => {
  const [method, setMethod] = useState('Netclient');
  const [netclientOS, setNetclientOS] = useState('Windows');
  const [RACOS, setRACOS] = useState('Windows');
  const store = useStore();
  const [selectedEnrollmentKey, setSelectedEnrollmentKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrollmentKeys() {
      const keys = await EnrollmentKeysService.getEnrollmentKeys();
      const filteredKeys = keys.data.filter((key) => key.tags.includes(networkId));
      setSelectedEnrollmentKey(filteredKeys.length > 0 ? filteredKeys[0].token : null);
    }
    fetchEnrollmentKeys();
  }, [networkId]);

  const branding = useBranding();

  const netclientOSSteps = [
    {
      Windows: [
        {
          title: 'Download and run the Windows installer',
          description: 'Requires Windows 7 SP1 or later.',
          CTA: 'Netclient for Windows',
          CTALink: getNetclientDownloadLink('windows', 'amd64')[0],
        },
        {
          title: 'In your CLI, run this command to install',
          description: 'You’ll be redirected automatically after connecting successfully.',
          Code: `netclient join -t ${`${selectedEnrollmentKey ?? '<token>'}`}`,
        },
      ],
    },
    {
      Mac: [
        {
          title: 'Download and run the Mac installer',
          CTA: 'Netclient for Mac',
          versions: [
            {
              version: 'Intel (AMD64)',
              link: getNetclientDownloadLink('macos', 'amd64')[0],
            },
            {
              version: 'Apple Silicon (M1/ARM64)',
              link: getNetclientDownloadLink('macos', 'arm64')[0],
            },
          ],
        },
        {
          title: 'In your CLI, run this command to install',
          Code: `netclient join -t ${`${selectedEnrollmentKey ?? '<token>'}`}`,
        },
      ],
    },
    {
      Linux: [
        {
          title: 'First, select your linux version and install with this command',
          Code: 'wget -O netclient https://fileserver.netmaker.io/releases/download/v0.25.0/netclient-linux-amd64 && chmod +x ./netclient && sudo ./netclient install',
        },
        {
          title: 'Join with this command',
          Code: `netclient join -t ${`${selectedEnrollmentKey ?? '<token>'}`}`,
        },
      ],
    },
    {
      Docker: [
        {
          title: 'In your CLI, run this command',
          Code: `sudo docker run -d --network host --privileged -e TOKEN=${selectedEnrollmentKey} -v /etc/netclient:/etc/netclient --name netclient gravitl/netclient:${
            store.serverConfig?.Version ?? '<version>'
          }`,
        },
        {
          title: 'Docker Compose',
          description: 'Note: It might take a few minutes for the host to show up in the network(s)',
          Code: `services:
  netclient:
    image: gravitl/netclient:${store.serverConfig?.Version ?? '<version>'}
    network_mode: host
    privileged: true
    environment:
      - TOKEN=${selectedEnrollmentKey}
    volumes:
      - /etc/netclient:/etc/netclient
`,
        },
      ],
    },
    {
      Mobile: [
        {
          title: 'Install our remote access client for mobile devices',
          description: `Easily connect to your ${branding.productName} network with our mobile application.`,
        },
      ],
    },
  ];

  const RACOSSteps = [
    {
      Windows: [
        {
          title: 'Download and launch the Remote Access Client app.',
          description: 'Requires Windows 7 SP1 or later.',
          CTA: 'RAC for Windows',
          CTALink: getNetclientDownloadLink('windows', 'amd64')[0],
        },
        {
          title: 'Copy your tenant ID.',
          Code: store.tenantId || store.serverConfig?.NetmakerTenantID || 'n/a',
        },
        {
          title: 'Paste your tenant ID into the "Server" field in the app.',
        },
        {
          title: 'Sign in using the same method you used on account.netmaker.io',
          description: [
            'For username and password: Type them in and click "Log in"',
            'For SSO: Click "Log in with Auth" and follow the prompts in your browser',
          ],
        },
        {
          title: `You'll see a list of gateways. If you don't, reach out to your admin for help.`,
        },
        {
          title: `Find the gateway you want to use and click its "Connect" button.`,
        },
      ],
    },
    {
      Mac: [
        {
          title: 'Download and launch the Remote Access Client app.',
          description: 'Choose your architecture.',
          CTA: 'RAC for Mac',
          versions: [
            {
              version: 'Apple Silicon (M1/ARM64)',
              link: getRACDownloadLink('macos', 'arm64')[0],
            },
            {
              version: 'Intel (AMD64)',
              link: getRACDownloadLink('macos', 'amd64')[0],
            },
          ],
        },
        {
          title: 'Copy your tenant ID.',
          Code: store.tenantId || store.serverConfig?.NetmakerTenantID || 'n/a',
        },
        {
          title: 'Paste your tenant ID into the "Server" field in the app.',
        },
        {
          title: 'Sign in using the same method you used on account.netmaker.io',
          description: [
            'For username and password: Type them in and click "Log in"',
            'For SSO: Click "Log in with Auth" and follow the prompts in your browser',
          ],
        },
        {
          title: `You'll see a list of gateways. If you don't, reach out to your admin for help.`,
        },
        {
          title: `Find the gateway you want to use and click its "Connect" button.`,
        },
      ],
    },
  ];

  const filters = [
    {
      name: 'Netclient',
      icon: ServerIcon,
      description: 'Easiest way to install a node locally in just a few simple steps.',
    },
    { name: 'Config files', icon: DocumentIcon, description: 'Connect various devices using simple client configs..' },
    {
      name: 'User Access',
      icon: UserIcon,
      description:
        'Connect from various devices using Remote Access Client. Active devices will be displayed in Active Users tab.',
    },
  ];

  const netclientOSOptions = [
    { name: 'Windows', iconSrc: windowsIconSrc },
    { name: 'Mac', iconSrc: macIconSrc },
    { name: 'Linux', iconSrc: linuxIconSrc },
    { name: 'Docker', iconSrc: dockerIconSrc },
    { name: 'Mobile', icon: DevicePhoneMobileIcon },
  ];

  const RACOsptions = [
    { name: 'Windows', iconSrc: windowsIconSrc },
    { name: 'Mac', iconSrc: macIconSrc },
    { name: 'Linux', iconSrc: linuxIconSrc },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#141414] bg-opacity-50">
      <div className="flex items-center justify-center min-h-full p-4 ">
        <div className="relative w-full max-w-[620px] bg-bg-default border border-stroke-default rounded-xl ">
          <div className="flex items-start justify-between w-full gap-6 py-6 pl-8 pr-3 border-b border-stroke-default bg-bg-default rounded-t-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl text-text-primary">Add new node</h2>
              <p className="text-text-secondary">Easily add a node via Netclient, a WireGuard config file or RAC.</p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex p-2 rounded-full hover:bg-opacity-50 hover:bg-button-outline-fill-hover"
            >
              <XMarkIcon className="w-5 h-5 text-button-outline-text-default" />
            </button>
          </div>
          <div>
            <div className="flex flex-col gap-2 px-8 py-5 border-b border-stroke-default">
              <div className="flex items-center gap-2 text-text-primary">
                <PlusIcon className="w-4 h-4" />
                <h3 className="text-sm-semibold">Choose a method</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setMethod(filter.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-200 ${
                      method === filter.name
                        ? 'bg-button-secondary-fill-default text-text-primary'
                        : 'bg-transparent text-text-secondary hover:bg-button-secondary-fill-hover'
                    }`}
                  >
                    {filter.icon && <filter.icon className="flex-shrink-0 w-4 h-4" />}
                    <span className="whitespace-nowrap">{filter.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-text-secondary">{filters.find((f) => f.name === method)?.description}</p>
            </div>

            <>
              <div className="flex flex-col">
                {method === 'Netclient' && (
                  <NetclientSection
                    netclientOS={netclientOS}
                    setNetclientOS={setNetclientOS}
                    netclientOSSteps={netclientOSSteps}
                    netclientOSOptions={netclientOSOptions}
                  />
                )}
                {method === 'Config files' && <ConfigFileTab networkId={networkId} onClose={onClose} />}
                {method === 'User Access' && (
                  <ActiveUsersSection RACOsSelected={RACOS} setRACOsSelected={setRACOS} RACOSSteps={RACOSSteps} />
                )}
              </div>
            </>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNodeDialog;
