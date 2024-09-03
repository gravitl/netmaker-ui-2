import { AppRoutes } from '@/routes';
import { AuthService } from '@/services/AuthService';
import { LoginDto } from '@/services/dtos/LoginDto';
import { useStore } from '@/store/store';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Col, Divider, Form, Image, Input, Layout, notification, Row, Typography } from 'antd';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AMUI_URL,
  NMUI_ACCESS_TOKEN_LOCALSTORAGE_KEY,
  NMUI_USERNAME_LOCALSTORAGE_KEY,
  NMUI_USER_LOCALSTORAGE_KEY,
  NMUI_USER_PLATFORM_ROLE_LOCALSTORAGE_KEY,
  isSaasBuild,
} from '../../services/BaseService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { UsersService } from '@/services/UsersService';
import { User, UserRole } from '@/models/User';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { resolveAppRoute, truncateQueryParamsFromCurrentUrl, useQuery } from '@/utils/RouteUtils';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useBranding } from '@/utils/Utils';
import UpgradeModal from '@/components/modals/upgrade-modal/UpgradeModal';

interface LoginPageProps {
  isFullScreen?: boolean;
}

// const USER_ERROR_MESSAGE = 'only admins can access dashboard';

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
  const isServerPro = store.serverStatus?.status?.is_pro;

  const oauthToken = query.get('login');
  const oauthUser = query.get('user');
  const [shouldRemember, setShouldRemember] = useState(false);
  const [isBasicAuthLoading, setIsBasicAuthLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const [isUserDeniedFromDashboard, setIsUserDeniedFromDashboard] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const getUserAndUpdateInStore = async (username: User['username']) => {
    try {
      const user = await (await UsersService.getUser(username)).data.Response;
      const userPlatformRole: UserRole = user.platform_role;
      if (userPlatformRole.deny_dashboard_access) {
        notify.error({
          message: 'Failed to login',
          description: 'You do not have permissions to access the dashboard',
        });
        setIsUserDeniedFromDashboard(true);
        return;
      }

      store.setStore({ user, userPlatformRole });
      window?.localStorage?.setItem(NMUI_USER_LOCALSTORAGE_KEY, JSON.stringify(user));
      window?.localStorage?.setItem(NMUI_USER_PLATFORM_ROLE_LOCALSTORAGE_KEY, JSON.stringify(user.platform_role));
    } catch (err) {
      notify.error({ message: 'Failed to get user details', description: extractErrorMsg(err as any) });
    }
  };

  const onLogin = async () => {
    try {
      const formData = await form.validateFields();
      setIsBasicAuthLoading(true);
      const data = await (await AuthService.login(formData)).data;
      store.setStore({ jwt: data.Response.AuthToken, username: data.Response.UserName });
      window?.localStorage?.setItem(NMUI_ACCESS_TOKEN_LOCALSTORAGE_KEY, data.Response.AuthToken);
      window?.localStorage?.setItem(NMUI_USERNAME_LOCALSTORAGE_KEY, data.Response.UserName);
      await storeFetchServerConfig();
      await getUserAndUpdateInStore(data.Response.UserName);
    } catch (err) {
      const errorMessage = extractErrorMsg(err as any);
      notify.error({ message: 'Failed to login', description: errorMessage });
      // checkLoginErrorMessage(errorMessage);
    } finally {
      setIsBasicAuthLoading(false);
    }
  };

  const checkIfServerHasAdminAndRedirect = useCallback(async () => {
    const hasAdmin = (await UsersService.serverHasAdmin()).data;
    if (!hasAdmin) navigate(resolveAppRoute(AppRoutes.SIGNUP_ROUTE));
  }, [navigate]);

  const onSSOLogin = useCallback(() => {
    if (!isServerPro) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsSsoLoading(true);
    if (!store.baseUrl) {
      notify.error({ message: 'Failed to login', description: 'Misconfigured Server URL' });
      setIsSsoLoading(false);
      return;
    }
    window.location.href = `${store.baseUrl}${ApiRoutes.LOGIN_OAUTH}`;
  }, [notify, store.baseUrl, isServerPro]);

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
            padding: props.isFullScreen ? 0 : 24,
          }}
          className="auth-page-container"
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
            {isUserDeniedFromDashboard && (
              <Alert
                description={
                  <>
                    User not authorized for dashboard access. Only admins can access the dashboard. Users should use the
                    remote access client.{' '}
                    <a href="https://docs.netmaker.io/pro/rac.html" target="_blank" rel="noopener noreferrer">
                      Click here for more details.
                    </a>
                  </>
                }
                type="error"
                showIcon
              />
            )}
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
              <Button type="primary" block onClick={onLogin} loading={isBasicAuthLoading}>
                {t('signin.signin')}
              </Button>
            </Form.Item>
            <Divider>
              <Typography.Text>{t('signin.or')}</Typography.Text>
            </Divider>
            <Form.Item style={{ marginTop: '1.5rem' }}>
              <Button type="default" block onClick={onSSOLogin} loading={isSsoLoading}>
                {t('signin.sso')}
              </Button>
            </Form.Item>
          </Form>
        </Layout.Content>
      </Layout>

      {/* misc */}
      {notifyCtx}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onUpgrade={() => setIsUpgradeModalOpen(false)}
        onCancel={() => setIsUpgradeModalOpen(false)}
      />
    </AppErrorBoundary>
  );
}
