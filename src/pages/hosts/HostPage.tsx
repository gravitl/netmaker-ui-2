import { Button, Col, Layout, Row, Typography } from 'antd';
import { PageProps } from '../../models/Page';

import './HostPage.scss';

export default function HostPage(props: PageProps) {
  return (
    <Layout.Content
      className="HostsPage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      {/* top bar */}
      <Row>
        <Col xs={24}>
          <Button type="link" style={{ padding: '0px' }}>
            <small>View All Hosts</small>
          </Button>
          <Typography.Title level={3} copyable style={{ marginTop: '0px' }}>
            my-default-host
          </Typography.Title>

          <div className="host-menu">
            <span className="host-menu-item active">Info</span>
            <span className="host-menu-item">Relay Status</span>
            <span className="host-menu-item">Networks</span>
            <span className="host-menu-item">
              <Button type="text" danger>
                Delete
              </Button>
            </span>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>hello detils</Col>
      </Row>
    </Layout.Content>
  );
}
