import { AppRoutes } from '@/routes';
import { AuthService } from '@/services/AuthService';
import { LoginDto } from '@/services/dtos/LoginDto';
import { useStore } from '@/store/store';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Divider, Form, Image, Input, Layout, notification, Row, Typography } from 'antd';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AMUI_URL, isSaasBuild } from '../../services/BaseService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { User } from '@/models/User';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { resolveAppRoute, truncateQueryParamsFromCurrentUrl, useQuery } from '@/utils/RouteUtils';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useBranding } from '@/utils/Utils';

interface LoginPageProps {
  isFullScreen?: boolean;
}

export default function LoginPage(props: LoginPageProps) {
  const [form] = Form.useForm<LoginDto>();
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const storeFetchServerConfig = store.fetchServerConfig;
  const navigate = useNavigate();
  const { backend, token } = useParams();
  const { t } = useTranslation();
  const query = useQuery();
  const location = useLocation();
  const currentTheme = store.currentTheme;
  const branding = useBranding();

  const oauthToken = query.get('login');
  const oauthUser = query.get('user');
  const [shouldRemember, setShouldRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getUserAndUpdateInStore = async (username: User['username']) => {
    try {
      const user = await (await UsersService.getUser(username)).data;

      if (!user?.issuperadmin && !user?.isadmin) {
        notify.error({ message: 'Failed to login', description: 'User is not an admin' });
        return;
      }
      store.setStore({ user });
    } catch (err) {
      notify.error({ message: 'Failed to get user details', description: extractErrorMsg(err as any) });
    }
  };

  const onLogin = async () => {
    try {
      const formData = await form.validateFields();
      setIsLoading(true);
      const data = await (await AuthService.login(formData)).data;
      store.setStore({ jwt: data.Response.AuthToken, username: data.Response.UserName });
      await storeFetchServerConfig();
      await getUserAndUpdateInStore(data.Response.UserName);
    } catch (err) {
      notify.error({ message: 'Failed to login', description: extractErrorMsg(err as any) });
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfServerHasAdminAndRedirect = useCallback(async () => {
    const hasAdmin = (await UsersService.serverHasAdmin()).data;
    if (!hasAdmin) navigate(resolveAppRoute(AppRoutes.SIGNUP_ROUTE));
  }, [navigate]);

  const onSSOLogin = useCallback(() => {
    setIsLoading(true);
    if (!store.baseUrl) {
      notify.error({ message: 'Failed to login', description: 'Misconfigured Server URL' });
      setIsLoading(false);
      return;
    }
    window.location.href = `${store.baseUrl}${ApiRoutes.LOGIN_OAUTH}`;
  }, [notify, store.baseUrl]);

  useEffect(() => {
    checkIfServerHasAdminAndRedirect();
  }, [checkIfServerHasAdminAndRedirect]);

  if (isSaasBuild) {
    if (!backend && !token) {
      window.location.href = AMUI_URL;
      return null;
    }
    store.setStore({ jwt: token, baseUrl: backend });
    truncateQueryParamsFromCurrentUrl();
    // TODO: load username
    navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE));
    return null;
  } else {
    if (oauthToken) {
      store.setStore({ jwt: oauthToken, username: oauthUser ?? undefined });
      if (oauthUser) {
        getUserAndUpdateInStore(oauthUser);
      }
      truncateQueryParamsFromCurrentUrl();
      navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE));
      return null;
    }
  }

  if (store.isLoggedIn()) {
    navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE));
  }

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
            <Col xs={24} style={{ textAlign: 'center' }}>
              <Image
                preview={false}
                width="200px"
                src={currentTheme === 'dark' ? branding.logoDarkUrl : branding.logoLightUrl}
              />
            </Col>
          </Row>

          <Row style={{ marginTop: '4rem' }}>
            <Col xs={24}>
              <Typography.Title level={2}>{t('signin.signin')}</Typography.Title>
            </Col>
          </Row>

          <Form
            form={form}
            layout="vertical"
            onKeyUp={(ev) => {
              if (ev.key === 'Enter') {
                onLogin();
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

            <Row style={{ marginBottom: '1.5rem' }}>
              <Col>
                <Checkbox checked={shouldRemember} onChange={(e) => setShouldRemember(e.target.checked)}>
                  {' '}
                  <Typography.Text>{t('signin.rememberme')}</Typography.Text>
                </Checkbox>
              </Col>
            </Row>

            <Typography.Text>
              {t('signin.terms1')} {/* eslint-disable-next-line react/jsx-no-target-blank */}
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
              <Button type="primary" block onClick={onLogin} loading={isLoading}>
                {t('signin.signin')}
              </Button>
            </Form.Item>
            <Divider>
              <Typography.Text>{t('signin.or')}</Typography.Text>
            </Divider>
            <Form.Item style={{ marginTop: '1.5rem' }}>
              <Button type="default" block onClick={onSSOLogin} loading={isLoading}>
                {t('signin.sso')}
              </Button>
            </Form.Item>
          </Form>
        </Layout.Content>

        {/* misc */}
        {notifyCtx}
      </Layout>
    </AppErrorBoundary>
  );
}
