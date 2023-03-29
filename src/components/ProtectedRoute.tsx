import { AppRoutes } from '@/routes';
import { useStore } from '@/store/store';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  condition: () => boolean;
  redirectPath: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({
  condition = () => useStore.getState().isLoggedIn(),
  redirectPath = AppRoutes.LOGIN_ROUTE,
  children,
}: ProtectedRouteProps) {
  if (!condition()) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
