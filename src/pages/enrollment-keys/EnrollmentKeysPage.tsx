import AddEnrollmentKeyModal from '@/components/modals/add-enrollment-key-modal/AddEnrollmentKeyModal';
import EnrollmentKeyDetailsModal from '@/components/modals/enrollment-key-details-modal/EnrollmentKeyDetailsModal';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { isEnrollmentKeyValid } from '@/utils/EnrollmentKeysUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  Layout,
  MenuProps,
  Modal,
  notification,
  Row,
  Skeleton,
  Table,
  TableColumnsType,
  Tag,
  Tour,
  TourProps,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageProps } from '../../models/Page';

import './EnrollmentKeysPage.scss';
import { useBranding } from '@/utils/Utils';
import UpdateEnrollmentKeyModal from '@/components/modals/update-enrollment-key-modal/UpdateEnrollmentKeyModal';
import { EllipsisHorizontalIcon, KeyIcon } from '@heroicons/react/24/solid';
import PageLayout from '@/layouts/PageLayout';
import { useStore } from '@/store/store';

export default function EnrollmentKeysPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const branding = useBranding();

  const [keys, setKeys] = useState<EnrollmentKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedKey, setSelectedKey] = useState<EnrollmentKey | null>(null);
  const [isKeyDetailsModalOpen, setIsKeyDetailsModalOpen] = useState(false);
  const [isEditKeyModalOpen, setIsEditKeyModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const enrollmentKeysTableRef = useRef(null);
  const createKeyButtonRef = useRef(null);
  const keyNameInputRef = useRef(null);
  const keyTypeSelectRef = useRef(null);
  const keyNetworksSelectRef = useRef(null);
  const keyRelaySelectRef = useRef(null);

  const store = useStore();

  const confirmRemoveKey = useCallback(
    (key: EnrollmentKey) => {
      Modal.confirm({
        title: `Delete key with tags ${key.tags.join(', ')}`,
        content: `Are you sure you want to remove this key?`,
        onOk: async () => {
          try {
            await EnrollmentKeysService.deleteEnrollmentKey(key.value);
            setKeys((keys) => keys.filter((k) => k.value !== key.value));
          } catch (err) {
            if (err instanceof AxiosError) {
              notify.error({
                message: 'Error removing key',
                description: extractErrorMsg(err),
              });
            }
          }
        },
      });
    },
    [notify],
  );

  const openKeyDetails = useCallback((key: EnrollmentKey) => {
    setSelectedKey(key);
    setIsKeyDetailsModalOpen(true);
  }, []);

  const closeKeyDetails = useCallback(() => {
    setSelectedKey(null);
    setIsKeyDetailsModalOpen(false);
  }, []);

  const openEditKeyModal = useCallback((key: EnrollmentKey) => {
    setSelectedKey(key);
    setIsEditKeyModalOpen(true);
  }, []);

  const closeEditKeyModal = useCallback(() => {
    setSelectedKey(null);
    setIsEditKeyModalOpen(false);
  }, []);

  const tableColumns: TableColumnsType<EnrollmentKey> = [
    {
      title: 'Name',
      dataIndex: 'tags',
      render: (value, key) => <Typography.Link onClick={() => openKeyDetails(key)}>{value.join(', ')}</Typography.Link>,
      sorter(a, b) {
        return a.tags.join('').localeCompare(b.tags.join(''));
      },
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Networks',
      dataIndex: 'networks',
      render: (networkIds: string[]) => {
        const networkNames = networkIds.map((netId) => {
          const network = store.networks.find((n) => n.netid === netId);
          return network?.name || netId;
        });
        return networkNames.join(', ');
      },
      sorter(a, b) {
        const getNetworkNames = (ids: string[]) =>
          ids
            .map((id) => {
              const network = store.networks.find((n) => n.netid === id);
              return network?.name || id;
            })
            .join('');
        return getNetworkNames(a.networks).localeCompare(getNetworkNames(b.networks));
      },
    },
    {
      title: 'Validity',
      render: (_, key) => {
        const isValid = isEnrollmentKeyValid(key);

        if (isValid) return <Tag color="success">Valid</Tag>;
        return <Tag color="error">Invalid</Tag>;
      },
    },
    {
      width: '1rem',
      render(_, key) {
        return (
          <Dropdown
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'edit',
                  label: (
                    <Typography.Text>
                      <EditOutlined /> Edit Key
                    </Typography.Text>
                  ),
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                    openEditKeyModal(key);
                  },
                },
                {
                  key: 'delete',
                  label: (
                    <Typography.Text type="danger">
                      <DeleteOutlined /> Delete Key
                    </Typography.Text>
                  ),
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                    confirmRemoveKey(key);
                  },
                },
              ] as MenuProps['items'],
            }}
          >
            <Button
              type="text"
              icon={
                <div className="rounded-md p-1/2 shrink-0 outline outline-stroke-default bg-bg-default hover:bg-bg-hover ">
                  <EllipsisHorizontalIcon className="w-6 h-6 text-text-primary" />
                </div>
              }
              onClick={(ev) => {
                ev.stopPropagation();
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  const filteredKeys = useMemo(
    () =>
      keys.filter((key) => {
        return key.tags.join('').concat(key.networks.join('')).toLowerCase().includes(searchText.toLowerCase());
      }),
    [keys, searchText],
  );

  const loadEnrollmentKeys = useCallback(async () => {
    try {
      setIsLoadingKeys(true);
      const keys = (await EnrollmentKeysService.getEnrollmentKeys()).data;
      keys.sort((a, b) => a.value.localeCompare(b.value));
      setKeys(keys);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({
          message: 'Error loading enrollment keys',
          description: extractErrorMsg(err),
        });
      }
    } finally {
      setIsLoadingKeys(false);
    }
  }, [notify]);

  const enrollmentKeysTourSteps: TourProps['steps'] = [
    {
      title: 'Enrollment Keys',
      description: (
        <>
          You can view the list of enrollment keys here. You can also view the specific details of each key by clicking
          on the key name on the right side there is an ellipsis button that allows you to either edit or delete a key.
        </>
      ),
      target: () => enrollmentKeysTableRef.current,
    },
    {
      title: 'Add a Key',
      description: <>You can add a new enrollment key by clicking on this button.</>,
      target: () => createKeyButtonRef.current,
    },
    {
      title: 'Add Key Name',
      description: <>You can add a name for your key here.</>,
      target: () => keyNameInputRef.current,
    },
    {
      title: 'Select Key Type',
      description: (
        <>
          You can select the type of key you want to create here, you can choose either time-bound, usage-based, and
          unlimited keys.
        </>
      ),
      target: () => keyTypeSelectRef.current,
    },
    {
      title: 'Select Networks to Add',
      description: <>You can select the networks you want to add to the key here.</>,
      target: () => keyNetworksSelectRef.current,
    },
    {
      title: 'Select if key is for a relay server',
      description: (
        <>
          You can select if the key is for a relay server here. So once a host joins using this key it automatically
          becomes relayed
        </>
      ),
      target: () => keyRelaySelectRef.current,
    },
  ];

  const handleTourOnChange = (current: number) => {
    setTourStep(current);
    switch (current) {
      case 1:
        setIsAddKeyModalOpen(false);
        break;
      case 2:
        setIsAddKeyModalOpen(true);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    loadEnrollmentKeys();
  }, [loadEnrollmentKeys]);

  return (
    <PageLayout
      title="Keys"
      isFullScreen
      description={
        <>
          Generate and manage cryptographic keys for secure network authentication.
          <br />
          Control access credentials and maintain encryption standards across your infrastructure.
        </>
      }
      icon={<KeyIcon className=" size-5" />}
    >
      <Skeleton loading={isLoadingKeys} active title={true}>
        {keys.length === 0 && (
          <>
            <Row className="card-con" gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Add a Key</Typography.Title>
              </Col>

              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Time-bound keys
                  </Typography.Title>
                  <Typography.Text>
                    Use an expiration date for a time-sensitive invite to your networks.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} xl={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Usage-based keys
                  </Typography.Title>
                  <Typography.Text>
                    Set an explicit number of uses for an enrollment key if you know how many devices need to join. Or
                    just set as 1 if joining one device.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={24} xl={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Unlimited keys
                  </Typography.Title>
                  <Typography.Text>
                    Make an unlimited key for easy use to enroll devices, and delete it when you&apos;re done.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
        {keys.length > 0 && (
          <>
            <Row justify="space-between">
              <Col xs={24} md={8}>
                <Input
                  size="large"
                  placeholder="Search keys"
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
                  prefix={<SearchOutlined />}
                  style={{ marginBottom: '.5rem' }}
                />
              </Col>
              <Col xs={24} md={12} style={{ textAlign: 'right' }} className="enrollment-keys-table-button">
                <Button
                  size="large"
                  style={{ marginRight: '0.5em', marginBottom: '.5rem' }}
                  onClick={() => {
                    setIsTourOpen(true);
                    setTourStep(0);
                  }}
                >
                  <InfoCircleOutlined /> Start Tour
                </Button>
                <Button
                  size="large"
                  style={{ marginRight: '0.5em', marginBottom: '.5rem' }}
                  onClick={() => loadEnrollmentKeys()}
                >
                  <ReloadOutlined /> Refresh keys
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setIsAddKeyModalOpen(true)}
                  ref={createKeyButtonRef}
                  style={{ marginBottom: '0.5rem' }}
                >
                  <PlusOutlined /> Create Key
                </Button>
              </Col>
            </Row>

            <Row justify="space-between">
              <Col xs={24}>
                <div className="w-full mt-5">
                  <Table
                    columns={tableColumns}
                    dataSource={filteredKeys}
                    rowKey="value"
                    scroll={{ x: true }}
                    onRow={(key) => {
                      return {
                        onClick: () => {
                          setSelectedKey(key);
                          setIsKeyDetailsModalOpen(true);
                        },
                      };
                    }}
                    ref={enrollmentKeysTableRef}
                    pagination={{ size: 'small', hideOnSinglePage: true, pageSize: 15 }}
                  />
                </div>
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      <Tour
        steps={enrollmentKeysTourSteps}
        open={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onChange={handleTourOnChange}
        current={tourStep}
      />

      {/* misc */}
      <AddEnrollmentKeyModal
        isOpen={isAddKeyModalOpen}
        onCreateKey={(key: EnrollmentKey) => {
          setIsAddKeyModalOpen(false);
          setKeys((prevKeys) => [...prevKeys, key].sort((k) => k.value.localeCompare(k.value)));
        }}
        onCancel={() => setIsAddKeyModalOpen(false)}
        keyNameInputRef={keyNameInputRef}
        keyTypeSelectRef={keyTypeSelectRef}
        keyNetworksSelectRef={keyNetworksSelectRef}
        keyRelaySelectRef={keyRelaySelectRef}
      />

      {isKeyDetailsModalOpen && selectedKey && (
        <EnrollmentKeyDetailsModal
          isOpen={isKeyDetailsModalOpen}
          key={`enrollment-key-detail-${selectedKey.value}`}
          enrollmentKey={selectedKey}
          onCancel={closeKeyDetails}
        />
      )}

      {isEditKeyModalOpen && selectedKey && (
        <UpdateEnrollmentKeyModal
          isOpen={isEditKeyModalOpen}
          key={`enrollment-key-update-${selectedKey.value}`}
          enrollmentKey={selectedKey}
          onUpdateKey={(key: EnrollmentKey) => {
            setIsEditKeyModalOpen(false);
            setKeys((prevKeys) =>
              [...prevKeys.filter((k) => k.value !== key.value), key].sort((k) => k.value.localeCompare(k.value)),
            );
          }}
          onCancel={closeEditKeyModal}
        />
      )}
      {notifyCtx}
    </PageLayout>
  );
}
