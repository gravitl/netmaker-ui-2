import Error404Page from './pages/errors/Error404Page';
import GettingStartedPage from './pages/GettingStartedPage';
import StartupPage from './pages/StartupPage';

export class AppRoutes {
  static STARTUP_ROUTE = '/';
  static GETTING_STARTED_ROUTE = '/getting-started';
}

export const routes = [
  { path: AppRoutes.STARTUP_ROUTE, element: <StartupPage /> },
  { path: AppRoutes.GETTING_STARTED_ROUTE, element: <GettingStartedPage /> },

  // fallback route
  { path: '*', element: <Error404Page /> },
];
