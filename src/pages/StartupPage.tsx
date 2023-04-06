// this page is to show in SaaS mode, when getting backend URL and other config

import { LoadingOutlined } from '@ant-design/icons';
import { Col, Layout, Row, Space, Typography, theme } from 'antd';

export default function StartupPage() {
  const { token: themeToken } = theme.useToken();
  return (
    <Layout style={{ height: '100vh' }}>
      <Row align="middle" justify="center" style={{ height: '100%' }}>
        <Col xs={24} style={{ textAlign: 'center' }}>
          <Space direction="vertical">
            <LoadingOutlined style={{ fontSize: '4rem', color: themeToken.colorText }} /> <br />
            <Typography.Text>Logging into the matrix...</Typography.Text>
          </Space>
        </Col>
      </Row>
    </Layout>
  );
}
