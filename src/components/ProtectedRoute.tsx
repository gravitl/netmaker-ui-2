import { AppRoutes } from '@/routes';
import { useStore } from '@/store/store';
import { resolveAppRoute } from '@/utils/RouteUtils';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  condition?: () => boolean;
  redirectPath?: string;
  children: JSX.Element;
}

export default function ProtectedRoute({ condition, redirectPath, children }: ProtectedRouteProps): JSX.Element {
  condition ??= () => useStore.getState().isLoggedIn();
  redirectPath ??= resolveAppRoute(AppRoutes.LOGIN_ROUTE);

  if (!condition()) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
