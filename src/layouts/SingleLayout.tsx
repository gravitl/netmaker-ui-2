import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

export default function SingleLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '0 16px' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
