import { useStore } from '@/store/store';
import { Button, Card, Col, Divider, Form, Input, Layout, notification, Row, theme, Typography } from 'antd';
import { PageProps } from '../../models/Page';
import './ProfilePage.scss';
import { resolveAppRoute } from '@/utils/RouteUtils';
import { Link } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import { UsersService } from '@/services/UsersService';
import { extractErrorMsg } from '@/utils/ServiceUtils';
import { useState } from 'react';
import { kebabCaseToTitleCase, snakeCaseToTitleCase } from '@/utils/Utils';
import { isSaasBuild } from '@/services/BaseService';

export default function ProfilePage(props: PageProps) {
  const [notify, notifyCtx] = notification.useNotification();
  const store = useStore();
  const { token: themeToken } = theme.useToken();

  const [form] = Form.useForm();
  const passwordVal = Form.useWatch('password', form);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateUser = async () => {
    try {
      const formData = await form.validateFields();
      setIsSubmitting(true);

      const payload: any = {
        ...(store.user ?? {}),
        password: formData.password || undefined,
      };

      delete payload['confirm-password'];

      await UsersService.updateUser(store.username!, payload);
      notification.success({ message: `Profile updated` });
      form.resetFields();
    } catch (err) {
      notify.error({
        message: 'Failed to update profile',
        description: extractErrorMsg(err as any),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout.Content
      className="ProfilePage"
      style={{ position: 'relative', height: '100%', padding: props.isFullScreen ? 0 : 24 }}
    >
      {/* top bar */}
      <Row className="tabbed-page-row-padding" style={{ borderBottom: `1px solid ${themeToken.colorBorder}` }}>
        <Col xs={24}>
          <Link to={resolveAppRoute(AppRoutes.USERS_ROUTE)}>Go to Users</Link>
          <Row>
            <Col xs={18} lg={12}>
              <Typography.Title level={2} style={{ marginTop: '.5rem', marginBottom: '2rem' }}>
                User Profile
              </Typography.Title>
            </Col>
          </Row>
        </Col>
      </Row>

      <div className="tabbed-page-row-padding" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Card className="profile-card">
          <Form name="profile-form" form={form} layout="vertical">
            <Row>
              <Col xs={24}>
                <Form.Item label="Username" name="username">
                  <Typography.Text>{store.username}</Typography.Text>
                </Form.Item>
              </Col>
            </Row>

            <Row>
              <Col xs={24}>
                <Form.Item label="Platform Access Level">
                  <Typography.Text>{kebabCaseToTitleCase(store.user?.platform_role_id ?? '')}</Typography.Text>
                </Form.Item>
              </Col>
            </Row>

            {!isSaasBuild && (
              <>
                <Row>
                  <Col xs={24}>
                    <Form.Item label="Authentication Type">
                      <Typography.Text>{snakeCaseToTitleCase(store.user?.auth_type ?? '')}</Typography.Text>
                    </Form.Item>
                  </Col>
                </Row>

                <Row>
                  <Col xs={24}>
                    <Form.Item label="Password" name="password">
                      <Input
                        placeholder="(unchanged)"
                        type="password"
                        disabled={store.user?.auth_type === 'oauth'}
                        title={store.user?.auth_type === 'oauth' ? 'Cannot change password of an oauth user' : ''}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row>
                  <Col xs={24}>
                    <Form.Item
                      label="Confirm Password"
                      name="confirm-password"
                      rules={[
                        {
                          validator(_, value) {
                            if (value !== passwordVal) {
                              return Promise.reject('Password must match');
                            } else {
                              return Promise.resolve();
                            }
                          },
                        },
                      ]}
                      dependencies={['password']}
                    >
                      <Input
                        placeholder="(unchanged)"
                        type="password"
                        disabled={store.user?.auth_type === 'oauth'}
                        title={store.user?.auth_type === 'oauth' ? 'Cannot change password of an oauth user' : ''}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />
                <Row>
                  <Col xs={24} style={{ textAlign: 'end' }}>
                    <Form.Item>
                      <Button
                        type="primary"
                        loading={isSubmitting}
                        onClick={() => {
                          updateUser();
                        }}
                      >
                        Update Profile
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}
          </Form>
        </Card>
      </div>

      {/* misc */}
      {notifyCtx}
    </Layout.Content>
  );
}
