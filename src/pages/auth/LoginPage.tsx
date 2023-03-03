import { AppRoutes } from '@/routes';
import { AuthService } from '@/services/AuthService';
import { LoginDto } from '@/services/dtos/LoginDto';
import { useStore } from '@/store/store';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Divider, Form, Input, Layout, notification, Row, Typography } from 'antd';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSaasBuild } from '../../services/BaseService';

interface LoginPageProps {
  isFullScreen?: boolean;
}

export default function LoginPage(props: LoginPageProps) {
  const [form] = Form.useForm<LoginDto>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const navigate = useNavigate();

  const [shouldRemember, setShouldRemember] = useState(false);

  const onLogin = async () => {
    try {
      const formData = await form.validateFields();
      const data = await (await AuthService.login(formData)).data;
      store.setStore({ jwt: data.Response.AuthToken, username: data.Response.UserName });
      console.log(store.jwt);
      console.log(useStore.getState().jwt);
      navigate(AppRoutes.HOME_ROUTE);
    } catch (err) {
      if (err instanceof AxiosError) {
        notify.error({ message: 'Failed to create network', description: (err as AxiosError).message });
      }
    }
  };

  const onSSOLogin = () => {};

  if (isSaasBuild) {
    window.location.href = process.env.REACT_APP_ACCOUNT_DASHBOARD_LOGIN_URL as string;
    return null;
  }

  // TODO: check if user is logged in in before route hook
  if (store.isLoggedIn()) {
    navigate(AppRoutes.HOME_ROUTE);
  }

  return (
    <Layout style={{ height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <Layout.Content
        style={{
          marginTop: '15vh',
          position: 'relative',
          height: 'fit-content',
          width: '40%',
          padding: props.isFullScreen ? 0 : 24,
        }}
      >
        <Row>
          <Col xs={24}>
            <Typography.Title level={2}>Sign In</Typography.Title>
          </Col>
        </Row>

        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Username" size="large" prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input placeholder="Password" type="password" size="large" prefix={<LockOutlined />} />
          </Form.Item>

          <Row style={{ marginBottom: '1.5rem' }}>
            <Col>
              <Checkbox checked={shouldRemember} onChange={(e) => setShouldRemember(e.target.checked)}>
                {' '}
                <Typography.Text>Remember me</Typography.Text>
              </Checkbox>
            </Col>
          </Row>

          <Typography.Text>
            By signing in you agree to our {/* eslint-disable-next-line react/jsx-no-target-blank */}
            <a href="https://netmaker.io" target="_blank">
              terms of service
            </a>{' '}
            and {/* eslint-disable-next-line react/jsx-no-target-blank */}
            <a href="https://netmaker.io" target="_blank">
              privacy policy
            </a>
            .
          </Typography.Text>

          <Form.Item style={{ marginTop: '1.5rem' }}>
            <Button type="primary" block onClick={onLogin}>
              Login
            </Button>
          </Form.Item>
          <Divider>
            <Typography.Text>OR</Typography.Text>
          </Divider>
          <Form.Item style={{ marginTop: '1.5rem' }}>
            <Button type="default" block onClick={onSSOLogin}>
              Login with SSO
            </Button>
          </Form.Item>
        </Form>
      </Layout.Content>

      {/* misc */}
      {notifyCtx}
    </Layout>
  );
}
