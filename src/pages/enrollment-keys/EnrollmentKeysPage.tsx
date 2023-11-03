import AddEnrollmentKeyModal from '@/components/modals/add-enrollment-key-modal/AddEnrollmentKeyModal';
import EnrollmentKeyDetailsModal from '@/components/modals/enrollment-key-details-modal/EnrollmentKeyDetailsModal';
import { EnrollmentKey } from '@/models/EnrollmentKey';
import { EnrollmentKeysService } from '@/services/EnrollmentKeysService';
import { isEnrollmentKeyValid } from '@/utils/EnrollmentKeysUtils';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
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
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageProps } from '../../models/Page';

import './EnrollmentKeysPage.scss';
import { useBranding } from '@/utils/Utils';
import UpdateEnrollmentKeyModal from '@/components/modals/update-enrollment -key-modal/updateEnrollmentKeyModal';

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
      render: (value) => value.join(', '),
      sorter(a, b) {
        return a.networks.join('').localeCompare(b.networks.join(''));
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
                    <Typography.Text onClick={() => openEditKeyModal(key)}>
                      <EditOutlined /> Edit Key
                    </Typography.Text>
                  ),
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                  },
                },
                {
                  key: 'delete',
                  label: (
                    <Typography.Text onClick={() => confirmRemoveKey(key)}>
                      <DeleteOutlined /> Delete Key
                    </Typography.Text>
                  ),
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                  },
                },
              ] as MenuProps['items'],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
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

  useEffect(() => {
    loadEnrollmentKeys();
  }, [loadEnrollmentKeys]);

  return (
    <Layout.Content
      className="EnrollmentKeysPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Skeleton loading={isLoadingKeys} active title={true} className="page-padding">
        {keys.length === 0 && (
          <>
            <Row
              className="page-padding"
              style={{
                background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
              }}
            >
              <Col xs={(24 * 2) / 3}>
                <Typography.Title level={3} style={{ color: 'white ' }}>
                  Enrollment Keys
                </Typography.Title>
                <Typography.Text style={{ color: 'white ' }}>
                  Enrollment keys allow you to enroll devices with your networks. You can automate enrollment and
                  control access by defining expiration, number of uses, or making an infinitely usable key.
                </Typography.Text>
              </Col>
              <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a Key</Typography.Title>
                  <Typography.Text>
                    Use enrollment keys to connect hosts (netclients) to your {branding.productName} networks or
                    register them to your {branding.productName} server.
                  </Typography.Text>
                  <Row style={{ marginTop: 'auto' }}>
                    <Col>
                      <Button type="primary" size="large" onClick={() => setIsAddKeyModalOpen(true)}>
                        <PlusOutlined /> Add a Key
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Row style={{ marginTop: '8rem', padding: '0px 5.125rem' }} gutter={[0, 20]}>
              <Col xs={24}>
                <Typography.Title level={3}>Add a Key</Typography.Title>
              </Col>

              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Time-bound keys
                  </Typography.Title>
                  <Typography.Text>
                    Use an expiration date for a time-sensitive invite to your networks.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7} style={{ marginRight: '1rem' }}>
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
              <Col xs={7}>
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
            <Row className="page-row-padding">
              <Col xs={24}>
                <Typography.Title level={3}>Enrollment Keys</Typography.Title>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={12} md={8}>
                <Input
                  size="large"
                  placeholder="Search keys"
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col xs={12} md={6} style={{ textAlign: 'right' }}>
                <Button type="primary" size="large" onClick={() => setIsAddKeyModalOpen(true)}>
                  <PlusOutlined /> Create Key
                </Button>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={24}>
                <Table
                  columns={tableColumns}
                  dataSource={filteredKeys}
                  rowKey="value"
                  onRow={(key) => {
                    return {
                      onClick: () => {
                        setSelectedKey(key);
                        setIsKeyDetailsModalOpen(true);
                      },
                    };
                  }}
                />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* misc */}
      <AddEnrollmentKeyModal
        isOpen={isAddKeyModalOpen}
        onCreateKey={(key: EnrollmentKey) => {
          setIsAddKeyModalOpen(false);
          setKeys((prevKeys) => [...prevKeys, key].sort((k) => k.value.localeCompare(k.value)));
        }}
        onCancel={() => setIsAddKeyModalOpen(false)}
      />

      {isKeyDetailsModalOpen && selectedKey && (
        <EnrollmentKeyDetailsModal
          isOpen={isKeyDetailsModalOpen}
          key={selectedKey.value}
          enrollmentKey={selectedKey}
          onCancel={closeKeyDetails}
        />
      )}

      {isEditKeyModalOpen && selectedKey && (
        <UpdateEnrollmentKeyModal
          isOpen={isEditKeyModalOpen}
          key={selectedKey.value}
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
    </Layout.Content>
  );
}
