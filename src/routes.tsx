import { createBrowserRouter, RouteObject } from 'react-router-dom';
import Error404Page from './pages/errors/Error404Page';
import DashboardPage from './pages/DashboardPage';
import StartupPage from './pages/StartupPage';
import MainLayout from './layouts/MainLayout';
import NewHostPage from './pages/hosts/NewHostPage';
import NetworksPage from './pages/networks/NetworksPage';
import LoginPage from './pages/auth/LoginPage';
import NetworkDetailsPage from './pages/networks/NetworkDetailsPage';
import EnrollmentKeysPage from './pages/enrollment-keys/EnrollmentKeysPage';
import HostsPage from './pages/hosts/HostsPage';
import ProtectedRoute from './components/ProtectedRoute';
import UsersPage from './pages/users/UsersPage';
import SignupPage from './pages/auth/SignupPage';
import { isSaasBuild } from './services/BaseService';
import NetworkHostDetailsPage from './pages/hosts/NetworkHostDetailsPage';
import HostDetailsPage from './pages/hosts/HostDetailsPage';
import { ServerConfigService } from './services/ServerConfigService';

export const AppRoutes = {
  DASHBOARD_ROUTE: '/',
  LOGIN_ROUTE: '/login',
  STARTUP_ROUTE: '/startup',
  GETTING_STARTED_ROUTE: '/hello',
  NEW_HOST_ROUTE: '/hosts-new',
  HOSTS_ROUTE: '/hosts',
  HOST_ROUTE: '/hosts/:hostId',
  NETWORK_HOST_ROUTE: '/networks/:networkId/hosts/:hostId',
  NETWORKS_ROUTE: '/networks',
  NETWORK_DETAILS_ROUTE: '/networks/:networkId',
  CLIENTS_ROUTE: '/clients',
  ENROLLMENT_KEYS_ROUTE: '/enrollment-keys',
  USERS_ROUTE: '/users',
  SIGNUP_ROUTE: '/signup',
};

function generateRoutePair(path: string, element: JSX.Element): RouteObject[] {
  const versionedPath = `${ServerConfigService?.getUiVersion() ?? ''}/${path}`;
  return [
    {
      path,
      element,
      caseSensitive: false,
    },
  ].concat(
    isSaasBuild
      ? {
          path: versionedPath,
          element,
          caseSensitive: false,
        }
      : []
  );
}

const routes: RouteObject[] = [
  {
    id: 'dashboard',
    path: AppRoutes.DASHBOARD_ROUTE,
    element: <MainLayout />,
    children: [
      ...generateRoutePair(
        '',
        <ProtectedRoute>
          <DashboardPage isFullScreen={false} />
        </ProtectedRoute>
      ),
      ...generateRoutePair(
        AppRoutes.HOSTS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <HostsPage isFullScreen />
        </ProtectedRoute>
      ),
      ...generateRoutePair(
        AppRoutes.HOST_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <HostDetailsPage isFullScreen />
        </ProtectedRoute>
      ),
      ...generateRoutePair(
        AppRoutes.NEW_HOST_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NewHostPage isFullScreen />
        </ProtectedRoute>
      ),
      ...generateRoutePair(
        AppRoutes.ENROLLMENT_KEYS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <EnrollmentKeysPage isFullScreen />
        </ProtectedRoute>
      ),
      ...generateRoutePair(AppRoutes.NETWORKS_ROUTE.split('/').slice(1).join('/'), <NetworksPage isFullScreen />),
      ...generateRoutePair(
        AppRoutes.NETWORK_DETAILS_ROUTE.split('/').slice(1).join('/'),
        <NetworkDetailsPage isFullScreen />
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_HOST_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkHostDetailsPage isFullScreen />
        </ProtectedRoute>
      ),
      ...generateRoutePair(
        AppRoutes.ENROLLMENT_KEYS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <EnrollmentKeysPage isFullScreen />
        </ProtectedRoute>
      ),
      ...generateRoutePair(
        AppRoutes.USERS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <UsersPage isFullScreen />
        </ProtectedRoute>
      ),
    ],
  },
  ...generateRoutePair(AppRoutes.STARTUP_ROUTE.split('/')[1], <StartupPage />),
  ...generateRoutePair(AppRoutes.LOGIN_ROUTE.split('/')[1], <LoginPage />),

  // fallback route
  { path: '*', element: <Error404Page /> },
];

// routes only available in standalone build
if (!isSaasBuild) {
  routes.push({ path: AppRoutes.SIGNUP_ROUTE, element: <SignupPage /> });
}

const router = createBrowserRouter(routes);

export { router };
