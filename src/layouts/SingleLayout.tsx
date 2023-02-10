import { Layout } from 'antd';

const { Content } = Layout;

export default function SingleLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '0 16px' }}></Content>
    </Layout>
  );
}
