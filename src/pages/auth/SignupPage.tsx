import { AppRoutes } from '@/routes';
import { AuthService } from '@/services/AuthService';
import { useStore } from '@/store/store';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Input, Layout, notification, Row, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { UsersService } from '@/services/UsersService';
import { CreateUserReqDto } from '@/services/dtos/UserDtos';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { resolveAppRoute } from '@/utils/RouteUtils';

interface SignupPageProps {
  isFullScreen?: boolean;
}

export default function SignupPage(props: SignupPageProps) {
  const [form] = Form.useForm<CreateUserReqDto>();
  const store = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const [isSigninup, setIsSigningup] = useState(false);
  const NETMAKER_SURVEY_LINK = 'https://www.netmaker.io/self-hosted-updates';

  const login = async (loginData: CreateUserReqDto) => {
    try {
      const data = await (await AuthService.login(loginData)).data;
      store.setStore({ jwt: data.Response.AuthToken, username: data.Response.UserName });
      navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE));
    } catch (err) {
      notification.error({ message: 'Failed to login', description: err as any });
      navigate(resolveAppRoute(AppRoutes.LOGIN_ROUTE));
    }
  };

  const onSignup = async () => {
    try {
      const formData = await form.validateFields();
      setIsSigningup(true);
      await UsersService.createAdminUser(formData);
      window.open(NETMAKER_SURVEY_LINK, '_blank');
      notification.info({
        message: 'A Survey has been opened in another tab.',
        description: 'Complete this optional survey to help improve the Netmaker experience.',
        duration: 30000,
      });
      login(formData);
    } catch (err) {
      notification.error({ message: 'Failed to create admin', description: extractErrorMsg(err as any) });
      if (err instanceof AxiosError && err.response?.status === 400) {
        navigate(resolveAppRoute(AppRoutes.LOGIN_ROUTE));
      }
    } finally {
      setIsSigningup(false);
    }
  };

  return (
    <AppErrorBoundary key={location.pathname}>
      <Layout style={{ height: '100%', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
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
              <Typography.Title level={2}>{t('auth.signup')}</Typography.Title>
            </Col>
          </Row>

          <Form
            form={form}
            layout="vertical"
            onKeyUp={(ev) => {
              if (ev.key === 'Enter') {
                onSignup();
              }
            }}
          >
            <Form.Item name="username" label={t('signin.username')} rules={[{ required: true }]}>
              <Input placeholder={String(t('signin.username'))} size="large" prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item name="password" label={t('signin.password')} rules={[{ required: true }]}>
              <Input
                placeholder={String(t('signin.password'))}
                type="password"
                size="large"
                prefix={<LockOutlined />}
              />
            </Form.Item>
            <Form.Item name="confirm-password" label={t('signin.confirm-password')} rules={[{ required: true }]}>
              <Input
                placeholder={String(t('signin.confirm-password'))}
                type="password"
                size="large"
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Typography.Text>
              {t('auth.terms5')} {/* eslint-disable-next-line react/jsx-no-target-blank */}
              <a href="https://www.netmaker.io/terms-and-conditions" target="_blank">
                {t('signin.terms2')}
              </a>{' '}
              {t('signin.terms3')} {/* eslint-disable-next-line react/jsx-no-target-blank */}
              <a href="https://www.netmaker.io/privacy-policy" target="_blank">
                {t('signin.terms4')}
              </a>
              .
            </Typography.Text>

            <Form.Item style={{ marginTop: '1.5rem' }}>
              <Button type="primary" block onClick={onSignup} loading={isSigninup}>
                {t('signin.signup')}
              </Button>
            </Form.Item>

            <Divider>
              <Typography.Text>{t('common.or')}</Typography.Text>
            </Divider>

            <Form.Item>
              <Button
                type="link"
                block
                onClick={() => navigate(resolveAppRoute(AppRoutes.LOGIN_ROUTE))}
                loading={isSigninup}
              >
                {t('auth.login')}
              </Button>
            </Form.Item>
          </Form>
        </Layout.Content>
      </Layout>
    </AppErrorBoundary>
  );
}
