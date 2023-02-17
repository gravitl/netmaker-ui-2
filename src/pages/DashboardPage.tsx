import { Button, Card, Col, Layout, Row, Space } from 'antd';
import { ArrowRightOutlined, PlusOutlined } from '@ant-design/icons';
import UpgradeModal from '../components/UpgradeModal';
import { Page } from '../models/Page';

export default function DashboardPage(props: Page) {
  return (
    <Layout.Content style={{ padding: props.isFullScreen ? 0 : 24 }}>
      {/* <Row>
        <Layout.Header></Layout.Header>
      </Row> */}
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
                <Button type="primary">
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
                <Button type="primary">
                  <PlusOutlined />
                  Get Started
                </Button>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* modals */}
      <UpgradeModal isOpen={false} />
    </Layout.Content>
  );
}
