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

export class AppRoutes {
  static DASHBOARD_ROUTE = '/';
  static LOGIN_ROUTE = '/login';
  static STARTUP_ROUTE = '/startup';
  static GETTING_STARTED_ROUTE = '/hello';
  static NEW_HOST_ROUTE = '/hosts-new';
  static HOSTS_ROUTE = '/hosts';
  static HOST_ROUTE = '/hosts/:hostId';
  static NETWORKS_ROUTE = '/networks';
  static NETWORK_DETAILS_ROUTE = '/networks/:networkId';
  static CLIENTS_ROUTE = '/clients';
  static ENROLLMENT_KEYS_ROUTE = '/enrollment-keys';
}

const routes: RouteObject[] = [
  {
    id: 'dashboard',
    path: AppRoutes.DASHBOARD_ROUTE,
    // element: <DashboardLayout />,
    element: <MainLayout />,
    children: [
      { path: '', element: <DashboardPage isFullScreen={false} /> },
      { path: AppRoutes.HOSTS_ROUTE.split('/').slice(1).join('/'), element: <HostsPage isFullScreen /> },
      { path: AppRoutes.HOST_ROUTE.split('/').slice(1).join('/'), element: <HostDetailsPage isFullScreen /> },
      { path: AppRoutes.NEW_HOST_ROUTE.split('/').slice(1).join('/'), element: <NewHostPage isFullScreen /> },
      { path: AppRoutes.NETWORKS_ROUTE.split('/').slice(1).join('/'), element: <NetworksPage isFullScreen /> },
      {
        path: AppRoutes.NETWORK_DETAILS_ROUTE.split('/').slice(1).join('/'),
        element: <NetworkDetailsPage isFullScreen />,
      },
      {
        path: AppRoutes.ENROLLMENT_KEYS_ROUTE.split('/').slice(1).join('/'),
        element: <EnrollmentKeysPage isFullScreen />,
      },
    ],
  },
  { path: AppRoutes.GETTING_STARTED_ROUTE, element: <GettingStartedPage /> },
  { path: AppRoutes.STARTUP_ROUTE, element: <StartupPage /> },
  { path: AppRoutes.LOGIN_ROUTE, element: <LoginPage /> },

  // fallback route
  { path: '*', element: <Error404Page /> },
];

const router = createBrowserRouter(routes);

export { router };
