import { createBrowserRouter, RouteObject } from 'react-router-dom';
import Error404Page from './pages/errors/Error404Page';
import GettingStartedPage from './pages/GettingStartedPage';
import DashboardPage from './pages/DashboardPage';
// import { DashboardLayout } from './layouts/DashboardLayout';
import StartupPage from './pages/StartupPage';
import MainLayout from './layouts/MainLayout';
import NewHostPage from './pages/hosts/NewHostPage';
import HostPage from './pages/hosts/HostPage';
import NetworksPage from './pages/networks/NetworksPage';
import LoginPage from './pages/auth/LoginPage';

export class AppRoutes {
  static HOME_ROUTE = '/';
  static LOGIN_ROUTE = '/login';
  static STARTUP_ROUTE = '/startup';
  static GETTING_STARTED_ROUTE = '/hello';
  static NEW_HOST_ROUTE = '/hosts-new';
  static HOST_ROUTE = '/hosts/:id';
  static NETWORKS_ROUTE = '/networks';
}

const routes: RouteObject[] = [
  {
    path: AppRoutes.HOME_ROUTE,
    // element: <DashboardLayout />,
    element: <MainLayout />,
    children: [
      { path: '', element: <DashboardPage isFullScreen={false} /> },
      { path: AppRoutes.NEW_HOST_ROUTE.split('/').slice(1).join('/'), element: <NewHostPage isFullScreen /> },
      { path: AppRoutes.HOST_ROUTE.split('/').slice(1).join('/'), element: <HostPage isFullScreen /> },
      { path: AppRoutes.NETWORKS_ROUTE.split('/').slice(1).join('/'), element: <NetworksPage isFullScreen /> },
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
