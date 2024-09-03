import { AppRoutes, router } from '@/routes';
import { AuthService } from '@/services/AuthService';
import { useStore } from '@/store/store';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Image, Input, Layout, notification, Radio, Result, Row, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { UsersService } from '@/services/UsersService';
import { CreateUserReqDto } from '@/services/dtos/UserDtos';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useCallback, useState } from 'react';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { resolveAppRoute, useQuery } from '@/utils/RouteUtils';
import { ApiRoutes } from '@/constants/ApiRoutes';
import UpgradeModal from '@/components/modals/upgrade-modal/UpgradeModal';
import { ServerConfigService } from '@/services/ServerConfigService';
import { useBranding } from '@/utils/Utils';

interface ContinueInvitePageProps {
  isFullScreen?: boolean;
}

type CreateUserForm = CreateUserReqDto & {
  'login-method': 'oauth' | 'basic-auth';
  'confirm-password': string;
};

export default function ContinueInvitePage(props: ContinueInvitePageProps) {
  const [form] = Form.useForm<CreateUserForm>();
  const store = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const query = useQuery();
  const [notify, notifyCtx] = notification.useNotification();
  const isServerPro = store.serverStatus?.status?.is_pro;
  const branding = useBranding();

  const [isSigninup, setIsSigningup] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);

  const username = decodeURIComponent(query.get('email') || '');
  const inviteCode = decodeURIComponent(query.get('invite_code') || '');

  const loginMethodVal = Form.useWatch('login-method', form);

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

  const onSSOLogin = useCallback(() => {
    if (!isServerPro) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsSsoLoading(true);
    if (!store.baseUrl) {
      notify.error({ message: 'Failed to create user', description: 'Misconfigured Server URL' });
      setIsSsoLoading(false);
      return;
    }
    window.location.href = `${store.baseUrl}${ApiRoutes.LOGIN_OAUTH}`;
  }, [notify, store.baseUrl, isServerPro]);

  const onSignup = async () => {
    try {
      const formData = await form.validateFields();
      setIsSigningup(true);
      const payload: any = { ...formData };
      delete payload['login-method'];
      delete payload['confirm-password'];
      await UsersService.userInviteSignup(inviteCode, payload);
      login(formData);
    } catch (err) {
      notification.error({ message: 'Failed to create user', description: extractErrorMsg(err as any) });
    } finally {
      setIsSigningup(false);
    }
  };

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
                src={store.currentTheme === 'dark' ? branding.logoDarkUrl : branding.logoLightUrl}
              />
            </Col>
          </Row>

          {!inviteCode && (
            <Row>
              <Col xs={24}>
                <Result
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                  }}
                  status="404"
                  title="404"
                  subTitle={t('auth.invalid-invite')}
                  extra={
                    <Button
                      type="primary"
                      onClick={() => {
                        // TODO: react does not want us to access .routes this way but it's the only way to check if the dashboard route is versioned at the moment
                        const hasVersionedDashboardRoute = router.routes.some((route) => {
                          return (
                            route.id === 'dashboard' &&
                            route.children?.some((r) => {
                              return r.path === `${ServerConfigService.getUiVersion()}${AppRoutes.DASHBOARD_ROUTE}`;
                            })
                          );
                        });
                        if (hasVersionedDashboardRoute) {
                          navigate(resolveAppRoute(AppRoutes.LOGIN_ROUTE));
                        } else {
                          navigate(AppRoutes.LOGIN_ROUTE);
                        }
                      }}
                    >
                      Go To Login
                    </Button>
                  }
                />
              </Col>
            </Row>
          )}

          {inviteCode && (
            <>
              <Row>
                <Col xs={24}>
                  <Typography.Title level={2}>{t('auth.signup-via-invite')}</Typography.Title>
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
                <Form.Item
                  name="username"
                  label={t('signin.username')}
                  initialValue={username}
                  rules={[{ required: true }]}
                >
                  <Input
                    placeholder={String(t('signin.username'))}
                    size="large"
                    prefix={<MailOutlined />}
                    value={username}
                    disabled
                  />
                </Form.Item>

                <Form.Item name="login-method" label="How would you like to proceed" style={{ marginTop: '2rem' }}>
                  <Radio.Group defaultValue="oauth" buttonStyle="solid">
                    <Radio value="oauth">With a social account (eg: Google, Microsoft, Github)</Radio>
                    <br />
                    <Radio value="basic-auth">I would like to set a password</Radio>
                  </Radio.Group>
                </Form.Item>

                {loginMethodVal !== 'basic-auth' && (
                  <Form.Item style={{ marginTop: '1.5rem' }}>
                    <Button type="primary" block onClick={onSSOLogin} loading={isSsoLoading}>
                      {t('auth.signup-with-sso')}
                    </Button>
                  </Form.Item>
                )}

                {loginMethodVal === 'basic-auth' && (
                  <>
                    <Form.Item name="password" label={t('signin.password')} rules={[{ required: true }]}>
                      <Input
                        placeholder={String(t('signin.password'))}
                        type="password"
                        size="large"
                        prefix={<LockOutlined />}
                      />
                    </Form.Item>
                    <Form.Item
                      name="confirm-password"
                      label={t('signin.confirm-password')}
                      rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords must match'));
                          },
                        }),
                      ]}
                    >
                      <Input
                        placeholder={String(t('signin.confirm-password'))}
                        type="password"
                        size="large"
                        prefix={<LockOutlined />}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '1.5rem' }}>
                      <Button type="primary" block onClick={onSignup} loading={isSigninup}>
                        {t('auth.signup-with-password')}
                      </Button>
                    </Form.Item>
                  </>
                )}

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
                    {t('auth.login')} instead
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </Layout.Content>
      </Layout>

      {/* upgrade modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onUpgrade={() => setIsUpgradeModalOpen(false)}
        onCancel={() => setIsUpgradeModalOpen(false)}
      />

      {/* misc */}
      {notifyCtx}
    </AppErrorBoundary>
  );
}
