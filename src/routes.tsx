import { createBrowserRouter, RouteObject } from 'react-router-dom';
import Error404Page from './pages/errors/Error404Page';
import GettingStartedPage from './pages/GettingStartedPage';
import DashboardPage from './pages/DashboardPage';
import { DashboardLayout } from './layouts/DashboardLayout';

export class AppRoutes {
  static DASHBOARD_ROUTE = '/';
  static GETTING_STARTED_ROUTE = '/hello';
}

const routes: RouteObject[] = [
  {
    path: AppRoutes.DASHBOARD_ROUTE,
    element: <DashboardLayout />,
    children: [{ path: '', element: <DashboardPage /> }],
  },
  { path: AppRoutes.GETTING_STARTED_ROUTE, element: <GettingStartedPage /> },

  // fallback route
  { path: '*', element: <Error404Page /> },
];

const router = createBrowserRouter(routes);

export { router };
