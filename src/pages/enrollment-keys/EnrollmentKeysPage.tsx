import { EnrollmentKey } from '@/models/EnrollmentKey';
import { Network } from '@/models/Network';
import { AppRoutes } from '@/routes';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  Layout,
  notification,
  Row,
  Skeleton,
  Table,
  TableColumnsType,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AddNetworkModal from '../../components/modals/add-network-modal/AddNetworkModal';
import { PageProps } from '../../models/Page';

import './EnrollmentKeysPage.scss';

export default function EnrollmentKeysPage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();

  const [keys, setKeys] = useState<EnrollmentKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const tableColumns: TableColumnsType<EnrollmentKey> = [
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: (value) => value.join(', '),
    },
    {
      title: 'Networks',
      dataIndex: 'networks',
      render: (value) => value.join(', '),
    },
    {
      title: 'Validity',
      // dataIndex: 'networks',
      // render: (value) => value.join(', '),
    },
  ];

  const filteredKeys = useMemo(
    () =>
      keys.filter((key) => {
        return key.tags.join('').concat(key.networks.join('')).toLowerCase().includes(searchText.toLowerCase());
      }),
    [keys, searchText]
  );

  const loadEnrollmentKeys = useCallback(async () => {
    try {
      setIsLoadingKeys(true);
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
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque amet modi cum aut doloremque dicta
                  reiciendis odit molestias nam animi enim et molestiae consequatur quas quo facere magni, maiores rem.
                </Typography.Text>
              </Col>
              <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
                <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
                  <Typography.Title level={3}>Add a Key</Typography.Title>
                  <Typography.Text>
                    Use enrollment keys to connect hosts (netclients) to your Netmaker networks or register them to your
                    Netmaker server.
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
                    Connect via Enrollment Keys
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7} style={{ marginRight: '1rem' }}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Connect via Enrollment Keys
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
              <Col xs={7}>
                <Card>
                  <Typography.Title level={4} style={{ marginTop: '0px' }}>
                    Connect via Enrollment Keys
                  </Typography.Title>
                  <Typography.Text>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi
                    quas eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta
                    ex quis.
                  </Typography.Text>
                </Card>
              </Col>
            </Row>
          </>
        )}
        {keys.length > 0 && (
          <>
            <Row className="page-row-padding-y page-row-padding-x">
              <Col xs={24}>
                <Typography.Title level={3}>Enrollment Keys</Typography.Title>
              </Col>
            </Row>

            <Row className="page-row-padding" justify="space-between">
              <Col xs={12} md={8}>
                <Input
                  size="large"
                  placeholder="Search keys..."
                  value={searchText}
                  onChange={(ev) => setSearchText(ev.target.value)}
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
                <Table columns={tableColumns} dataSource={filteredKeys} rowKey="netid" />
              </Col>
            </Row>
          </>
        )}
      </Skeleton>

      {/* misc */}
      <AddNetworkModal
        isOpen={isAddKeyModalOpen}
        onCreateNetwork={(network: Network) => {
          setIsAddKeyModalOpen(false);
        }}
        onCancel={() => setIsAddKeyModalOpen(false)}
      />
      {notifyCtx}
    </Layout.Content>
  );
}
