import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, ConfigProvider, Layout, Row, theme, Typography } from 'antd';
import { useState } from 'react';
import AddNetworkModal from '../../components/modals/add-network-modal/AddNetworkModal';
import { PageProps } from '../../models/Page';
import { useStore } from '../../store/store';

import './NetworksPage.scss';

export default function NetworksPage(props: PageProps) {
  const store = useStore();

  const [isAddNetworkModalOpen, setIsAddNetworkModalOpen] = useState(false);

  return (
    <Layout.Content
      className="NetworksPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      <Row
        style={{
          padding: '3.75rem 5.125rem 7.5rem 5.125rem',
          background: 'linear-gradient(90deg, #52379F 0%, #B66666 100%)',
        }}
      >
        <Col xs={(24 * 2) / 3}>
          <Typography.Title level={3} style={{ color: 'white ' }}>
            Networks
          </Typography.Title>
          <Typography.Text style={{ color: 'white ' }}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque amet modi cum aut doloremque dicta
            reiciendis odit molestias nam animi enim et molestiae consequatur quas quo facere magni, maiores rem.
          </Typography.Text>
        </Col>
        <Col xs={(24 * 1) / 3} style={{ position: 'relative' }}>
          <Card className="header-card" style={{ height: '20rem', position: 'absolute', width: '100%' }}>
            <Typography.Title level={3}>Add a Network</Typography.Title>
            <Typography.Text>Add networks to enable fast and secure communication between hosts</Typography.Text>
            <Row style={{ marginTop: 'auto' }}>
              <Col>
                <Button type="primary" onClick={() => setIsAddNetworkModalOpen(true)}>
                  <PlusOutlined /> Add a Network
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: '8rem', padding: '0px 5.125rem' }} gutter={[0, 20]}>
        <Col xs={24}>
          <Typography.Title level={3}>Add a Network</Typography.Title>
        </Col>

        <Col xs={7} style={{ marginRight: '1rem' }}>
          <Card>
            <Typography.Title level={4} style={{ marginTop: '0px' }}>
              Communicate via networks
            </Typography.Title>
            <Typography.Text>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi quas
              eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta ex quis.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={7} style={{ marginRight: '1rem' }}>
          <Card>
            <Typography.Title level={4} style={{ marginTop: '0px' }}>
              Communicate via networks
            </Typography.Title>
            <Typography.Text>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi quas
              eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta ex quis.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={7}>
          <Card>
            <Typography.Title level={4} style={{ marginTop: '0px' }}>
              Communicate via networks
            </Typography.Title>
            <Typography.Text>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, beatae quis. Possimus commodi quas
              eveniet, nostrum iure eaque unde illo deleniti obcaecati aut aliquid ab sapiente ipsum soluta ex quis.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* modals */}
      <AddNetworkModal isOpen={isAddNetworkModalOpen} onCancel={() => setIsAddNetworkModalOpen(false)} />
    </Layout.Content>
  );
}
