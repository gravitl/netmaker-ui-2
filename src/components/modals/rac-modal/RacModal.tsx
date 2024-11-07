import React, { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/solid';
import { getNetclientDownloadLink, getRACDownloadLink } from '@/utils/RouteUtils';
import { useStore } from '@/store/store';
import { Row, Col, QRCode, Typography } from 'antd';
import { useTheme } from 'antd-style';
import windowsIconSrc from '../../../../public/icons/windows.svg';
import macIconSrc from '../../../../public/icons/apple.svg';
import linuxIconSrc from '../../../../public/icons/linux.svg';
import { ExternalLinks } from '@/constants/LinkAndImageConstants';
import { isSaasBuild } from '@/services/BaseService';

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

const ActiveUsersSection: React.FC<{
  RACOsSelected: string;
  setRACOsSelected: (os: string) => void;
  RACOSSteps: any[];
}> = ({ RACOsSelected, setRACOsSelected, RACOSSteps }) => {
  const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});
  const [downloadLink, setDownloadLink] = useState<string>('');
  const antdTheme = useTheme();

  const RACOsOptions = [
    { name: 'Windows', iconSrc: windowsIconSrc },
    { name: 'Mac', iconSrc: macIconSrc },
    { name: 'Linux', iconSrc: linuxIconSrc },
    { name: 'Mobile', icon: DevicePhoneMobileIcon },
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 px-8 py-6 ">
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
              {option.iconSrc ? (
                <img src={option.iconSrc} alt={`${option.name} icon`} className="w-4 h-4" />
              ) : option.icon ? (
                <option.icon className="w-4 h-4" />
              ) : null}
              <span className="whitespace-nowrap">{option.name}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-7 mt-7">
          {RACOSSteps.filter((step) => step[RACOsSelected]).map((step) =>
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

                  {RACOsSelected === 'Linux' && instruction.versions && (
                    <>
                      {instruction.versions.map(
                        (version: any) =>
                          version.version === selectedVersions[RACOsSelected] && (
                            <CopyableCodeTag key={version.version} code={version.Code} />
                          ),
                      )}
                    </>
                  )}

                  {(!instruction.versions || RACOsSelected !== 'Linux') && (
                    <>
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
                    </>
                  )}

                  {RACOsSelected === 'Mobile' && index === 0 && (
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
    </div>
  );
};

const RacModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [RACOS, setRACOS] = useState('Windows');
  const store = useStore();

  const RACOSSteps = [
    {
      Windows: [
        {
          title: 'Download and launch the Remote Access Client app.',
          description: 'Requires Windows 7 SP1 or later.',
          CTA: 'RAC for Windows',
          CTALink: getNetclientDownloadLink('windows', 'amd64')[0],
        },
        ...(isSaasBuild
          ? [
              {
                title: 'Copy your tenant ID.',
                Code: store.tenantId || store.serverConfig?.NetmakerTenantID || 'n/a',
              },
            ]
          : [
              {
                title: 'Copy Your Server Domain.',
                Code: store.serverConfig?.APIHost || 'n/a',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Paste your tenant ID into the "Server" field in the app.',
              },
            ]
          : [
              {
                title: 'Paste your Server Domain into the "Server" field in the app.',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Sign in using the same method you used on account.netmaker.io',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]
          : [
              {
                title: 'Sign in using the registered account.',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]),

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
          description: 'Choose your CPU architecture.',
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
        ...(isSaasBuild
          ? [
              {
                title: 'Copy your tenant ID.',
                Code: store.tenantId || store.serverConfig?.NetmakerTenantID || 'n/a',
              },
            ]
          : [
              {
                title: 'Copy Your Server Domain.',
                Code: store.serverConfig?.APIHost || 'n/a',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Paste your tenant ID into the "Server" field in the app.',
              },
            ]
          : [
              {
                title: 'Paste your Server Domain into the "Server" field in the app.',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Sign in using the same method you used on account.netmaker.io',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]
          : [
              {
                title: 'Sign in using the registered account.',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]),

        {
          title: `You'll see a list of gateways. If you don't, reach out to your admin for help.`,
        },
        {
          title: `Find the gateway you want to use and click its "Connect" button.`,
        },
      ],
    },
    {
      Linux: [
        {
          title: 'Download and launch the Remote Access Client app.',
          description: 'Choose your Linux version.',
          CTA: 'RAC for Linux',
          versions: [
            {
              version: 'Ubuntu/Debian',
              Code: `curl -sL 'https://apt.netmaker.org/remote-client/gpg.key' | sudo tee /etc/apt/trusted.gpg.d/remote-client.asc
curl -sL 'https://apt.netmaker.org/remote-client/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/remote-client.list
sudo apt update
sudo apt search remote-client  # to see available versions
sudo apt install remote-client
`,
            },
            {
              version: 'Fedora/RedHat/CentOS/Rocky',
              Code: `curl -sL 'https://rpm.netmaker.org/remote-client/gpg.key' | sudo tee /tmp/gpg.key
curl -sL 'https://rpm.netmaker.org/remote-client/remote-client-repo' | sudo tee /etc/yum.repos.d/remote-client.repo
sudo rpm --import /tmp/gpg.key
sudo dnf check-update
sudo dnf install remote-client
`,
            },
          ],
        },
        ...(isSaasBuild
          ? [
              {
                title: 'Copy your tenant ID.',
                Code: store.tenantId || store.serverConfig?.NetmakerTenantID || 'n/a',
              },
            ]
          : [
              {
                title: 'Copy Your Server Domain.',
                Code: store.serverConfig?.APIHost || 'n/a',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Paste your tenant ID into the "Server" field in the app.',
              },
            ]
          : [
              {
                title: 'Paste your Server Domain into the "Server" field in the app.',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Sign in using the same method you used on account.netmaker.io',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]
          : [
              {
                title: 'Sign in using the registered account.',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]),

        {
          title: `You'll see a list of gateways. If you don't, reach out to your admin for help.`,
        },
        {
          title: `Find the gateway you want to use and click its "Connect" button.`,
        },
      ],
    },
    {
      Mobile: [
        {
          title: 'Download and launch the Remote Access Client app.',
          description: 'Choose your CPU architecture.',
        },
        ...(isSaasBuild
          ? [
              {
                title: 'Copy your tenant ID.',
                Code: store.tenantId || store.serverConfig?.NetmakerTenantID || 'n/a',
              },
            ]
          : [
              {
                title: 'Copy Your Server Domain.',
                Code: store.serverConfig?.APIHost || 'n/a',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Paste your tenant ID into the "Server" field in the app.',
              },
            ]
          : [
              {
                title: 'Paste your Server Domain into the "Server" field in the app.',
              },
            ]),
        ...(isSaasBuild
          ? [
              {
                title: 'Sign in using the same method you used on account.netmaker.io',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]
          : [
              {
                title: 'Sign in using the registered account.',
                description: [
                  'For username and password: Type them in and click "Log in."',
                  'For SSO: Click "Log in with Auth" and follow the prompts in your browser.',
                ],
              },
            ]),

        {
          title: `You'll see a list of gateways. If you don't, reach out to your admin for help.`,
        },
        {
          title: `Find the gateway you want to use and click its "Connect" button.`,
        },
      ],
    },
  ];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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
    <div onClick={handleOverlayClick} className="fixed inset-0 z-50 overflow-y-auto bg-[#141414] bg-opacity-50">
      <div className="flex items-center justify-center min-h-full p-4 " onClick={handleOverlayClick}>
        <div
          className="relative w-full max-w-[620px] bg-bg-default border border-stroke-default rounded-xl "
          onClick={handleDialogClick}
        >
          <div className="flex items-start justify-between w-full gap-6 py-6 pl-8 pr-3 border-b border-stroke-default bg-bg-default rounded-t-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl text-text-primary">Download Remote Access Client</h2>
              <p className="text-text-secondary">Easily connect to your network via RAC.</p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex p-2 rounded-full hover:bg-opacity-50 hover:bg-button-outline-fill-hover"
            >
              <XMarkIcon className="w-5 h-5 text-button-outline-text-default" />
            </button>
          </div>
          <div>
            <>
              <div className="flex flex-col">
                <ActiveUsersSection RACOsSelected={RACOS} setRACOsSelected={setRACOS} RACOSSteps={RACOSSteps} />
              </div>
            </>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RacModal;
