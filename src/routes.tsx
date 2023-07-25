import { createBrowserRouter, RouteObject } from 'react-router-dom';
import Error404Page from './pages/errors/Error404Page';
import GettingStartedPage from './pages/GettingStartedPage';
import DashboardPage from './pages/DashboardPage';
// import { DashboardLayout } from './layouts/DashboardLayout';
import StartupPage from './pages/StartupPage';
import MainLayout from './layouts/MainLayout';
import NewHostPage from './pages/hosts/NewHostPage';
import HostDetailsPage from './pages/hosts/HostDetailsPage';
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

export class AppRoutes {
  static DASHBOARD_ROUTE = '/';
  static LOGIN_ROUTE = '/login';
  static STARTUP_ROUTE = '/startup';
  static GETTING_STARTED_ROUTE = '/hello';
  static NEW_HOST_ROUTE = '/hosts-new';
  static HOSTS_ROUTE = '/hosts';
  static HOST_ROUTE = '/hosts/:hostId';
  static NETWORK_HOST_ROUTE = '/networks/:networkId/hosts/:hostId';
  static NETWORKS_ROUTE = '/networks';
  static NETWORK_DETAILS_ROUTE = '/networks/:networkId';
  static CLIENTS_ROUTE = '/clients';
  static ENROLLMENT_KEYS_ROUTE = '/enrollment-keys';
  static USERS_ROUTE = '/users';
  static SIGNUP_ROUTE = '/signup';
}

const routes: RouteObject[] = [
  {
    id: 'dashboard',
    path: AppRoutes.DASHBOARD_ROUTE,
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: (
          <ProtectedRoute>
            <DashboardPage isFullScreen={false} />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.HOSTS_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <HostsPage isFullScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.HOST_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <HostDetailsPage isFullScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.NEW_HOST_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <NewHostPage isFullScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.NETWORKS_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <NetworksPage isFullScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.NETWORK_DETAILS_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <NetworkDetailsPage isFullScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.NETWORK_HOST_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <NetworkHostDetailsPage isFullScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.ENROLLMENT_KEYS_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <EnrollmentKeysPage isFullScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: AppRoutes.USERS_ROUTE.split('/').slice(1).join('/'),
        element: (
          <ProtectedRoute>
            <UsersPage isFullScreen />
          </ProtectedRoute>
        ),
      },
    ],
  },
  { path: AppRoutes.GETTING_STARTED_ROUTE, element: <GettingStartedPage /> },
  { path: AppRoutes.STARTUP_ROUTE, element: <StartupPage /> },
  { path: AppRoutes.LOGIN_ROUTE, element: <LoginPage /> },

  // fallback route
  { path: '*', element: <Error404Page /> },
];

// routes only available in standalone build
if (!isSaasBuild) {
  routes.push({ path: AppRoutes.SIGNUP_ROUTE, element: <SignupPage /> });
}

const router = createBrowserRouter(routes);

export { router };
