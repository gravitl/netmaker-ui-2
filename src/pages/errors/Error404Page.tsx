import { AppRoutes, router } from '@/routes';
import { ServerConfigService } from '@/services/ServerConfigService';
import { resolveAppRoute } from '@/utils/RouteUtils';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function Error404Page() {
  const navigate = useNavigate();

  return (
    <Result
      style={{
        height: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
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
              navigate(resolveAppRoute(AppRoutes.DASHBOARD_ROUTE));
            } else {
              navigate(AppRoutes.DASHBOARD_ROUTE);
            }
          }}
        >
          Back Home
        </Button>
      }
    />
  );
}
