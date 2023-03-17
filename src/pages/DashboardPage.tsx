import { Alert, Button, Card, Col, Input, Layout, Row, Space, theme, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  BellOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import UpgradeModal from '../components/modals/upgrade-modal/UpgradeModal';
import { PageProps } from '../models/Page';
import { AppRoutes } from '../routes';
import { useNavigate } from 'react-router-dom';
import AddNetworkModal from '@/components/modals/add-network-modal/AddNetworkModal';
import { useState } from 'react';
import { Network } from '@/models/Network';

export default function DashboardPage(props: PageProps) {
  const navigate = useNavigate();
  const { token: themeToken } = theme.useToken();

  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);

  const goToNewHostPage = () => {
    navigate(AppRoutes.NEW_HOST_ROUTE);
  };

  return (
    <Layout.Content style={{ padding: props.isFullScreen ? 0 : 24 }}>
      <Row>
        <Layout.Header style={{ width: '100%', padding: '0px', backgroundColor: 'transparent' }}>
          <Row>
            <Col xs={6}>
              <Alert
                message="You are on the free plan"
                type="warning"
                action={
                  <Button type="link">
                    <span style={{ textDecoration: 'underline' }}>Upgrade now</span>
                  </Button>
                }
              />
            </Col>
            <Col xs={6}></Col>
            <Col xs={12} style={{ textAlign: 'right' }}>
              <Space direction="horizontal" size="large" align="end">
                <Input
                  placeholder="Search..."
                  suffix={<SearchOutlined />}
                  style={{ borderRadius: '24px', width: '20rem' }}
                />
                <Button type="primary" style={{}}>
                  <PlusOutlined /> Create
                </Button>
                <Tooltip title="Help">
                  <QuestionCircleOutlined
                    style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                    onClick={() => {
                      window.open('https://docs.netmaker.io', '_blank');
                    }}
                  />
                </Tooltip>
                <Tooltip title="Notifications">
                  <BellOutlined
                    style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                    onClick={() => {
                      // TODO: notifications
                    }}
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Layout.Header>
      </Row>
      <Row>
        <Col>
          <Space direction="vertical" size="middle">
            <Card>
              <h3>Start using Netmaker</h3>
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore impedit soluta reprehenderit quo velit
                corporis assumenda vel enim sed repellat quibusdam molestias voluptatibus illum magni laborum
                recusandae, odit saepe provident aliquam repudiandae iste nostrum, possimus at eligendi. Ab quibusdam
                sunt voluptates corporis nesciunt rem, libero doloribus officiis architecto accusantium aliquam nisi
                praesentium placeat explicabo tempore officia quia quod fuga quasi.
              </p>
              <div>
                <Button type="link">
                  <ArrowRightOutlined />
                  Take the tutorial
                </Button>
              </div>
            </Card>
            {/* TODO: check if no networks before rendering */}
            <Card style={{ maxWidth: '30%' }}>
              <h3>Add a network</h3>
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit. Consequatur possimus ex quae veritatis
                architecto esse.
              </p>
              <div>
                <Button type="primary" onClick={() => setIsAddNetworkModalOpen(true)}>
                  <PlusOutlined />
                  Get Started
                </Button>
              </div>
            </Card>
            {/* TODO: check if no networks and no hosts before rendering */}
            <Card style={{ maxWidth: '30%' }}>
              <h3>Add a host</h3>
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit. Consequatur possimus ex quae veritatis
                architecto esse.
              </p>
              <div>
                <Button type="primary" onClick={goToNewHostPage}>
                  <PlusOutlined />
                  Get Started
                </Button>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* misc */}
      <UpgradeModal isOpen={false} />
      <AddNetworkModal
        isOpen={isAddNetworkModalOpen}
        onCreateNetwork={(network: Network) => {
          setIsAddNetworkModalOpen(false);
        }}
        onCancel={() => setIsAddNetworkModalOpen(false)}
      />
    </Layout.Content>
  );
}
