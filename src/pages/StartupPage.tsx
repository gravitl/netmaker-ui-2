// this page is to show in SaaS mode, when getting backend URL and other config

import { LoadingOutlined } from '@ant-design/icons';
import { Col, Layout, Row, Space } from 'antd';

export default function StartupPage() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Row align="middle" justify="center" style={{ height: '100%' }}>
        <Col xs={24} style={{ textAlign: 'center' }}>
          <Space direction="vertical">
            <LoadingOutlined style={{ fontSize: '4rem' }} /> <br />
            Logging into the matrix...
          </Space>
        </Col>
      </Row>
    </Layout>
  );
}
