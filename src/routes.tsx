import { createBrowserRouter, RouteObject } from 'react-router-dom';
import Error404Page from './pages/errors/Error404Page';
import GettingStartedPage from './pages/GettingStartedPage';
import DashboardPage from './pages/DashboardPage';
// import { DashboardLayout } from './layouts/DashboardLayout';
import StartupPage from './pages/StartupPage';
import MainLayout from './layouts/MainLayout';

export class AppRoutes {
  static DASHBOARD_ROUTE = '/';
  static STARTUP_ROUTE = '/startup';
  static GETTING_STARTED_ROUTE = '/hello';
}

const routes: RouteObject[] = [
  {
    path: AppRoutes.DASHBOARD_ROUTE,
    // element: <DashboardLayout />,
    element: <MainLayout />,
    children: [{ path: '', element: <DashboardPage /> }],
  },
  { path: AppRoutes.GETTING_STARTED_ROUTE, element: <GettingStartedPage /> },
  { path: AppRoutes.STARTUP_ROUTE, element: <StartupPage /> },

  // fallback route
  { path: '*', element: <Error404Page /> },
];

const router = createBrowserRouter(routes);

export { router };
