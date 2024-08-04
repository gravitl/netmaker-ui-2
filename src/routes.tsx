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
import CreateNetworkRolePage from './pages/users/CreateNetworkRolePage';
import NetworkRoleDetailsPage from './pages/users/NetworkRoleDetailsPage';
import CreateUserGroupPage from './pages/users/CreateUserGroupPage';
import ContinueInvitePage from './pages/auth/ContinueInvitePage';
import UserGroupDetailsPage from './pages/users/UserGroupDetailsPage';
import PlatformRoleDetailsPage from './pages/users/PlatformRoleDetailsPage';
import ProfilePage from './pages/users/ProfilePage';

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
  CREATE_NETWORK_ROLE_ROUTE: '/users/create-network-role',
  NETWORK_ROLE_DETAILS_ROUTE: '/users/network-role/:roleId',
  CREATE_GROUP_ROUTE: '/users/create-group',
  CONTINUE_INVITE_ROUTE: '/invite',
  USER_GROUP_DETAILS_ROUTE: '/users/group/:groupId',
  PLATFORM_ROLE_DETAILS_ROUTE: '/users/platform-role/:roleId',
  PROFILE_ROUTE: '/profile',
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
      : [],
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
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.HOSTS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <HostsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.HOST_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <HostDetailsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NEW_HOST_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NewHostPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.ENROLLMENT_KEYS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <EnrollmentKeysPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(AppRoutes.NETWORKS_ROUTE.split('/').slice(1).join('/'), <NetworksPage isFullScreen />),
      ...generateRoutePair(
        AppRoutes.NETWORK_DETAILS_ROUTE.split('/').slice(1).join('/'),
        <NetworkDetailsPage isFullScreen />,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_HOST_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkHostDetailsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.ENROLLMENT_KEYS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <EnrollmentKeysPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.USERS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <UsersPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.CREATE_NETWORK_ROLE_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <CreateNetworkRolePage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_ROLE_DETAILS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkRoleDetailsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.PLATFORM_ROLE_DETAILS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <PlatformRoleDetailsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.CREATE_GROUP_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <CreateUserGroupPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.USER_GROUP_DETAILS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <UserGroupDetailsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.PROFILE_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <ProfilePage isFullScreen />
        </ProtectedRoute>,
      ),
    ],
  },
  ...generateRoutePair(AppRoutes.STARTUP_ROUTE.split('/')[1], <StartupPage />),
  ...generateRoutePair(AppRoutes.LOGIN_ROUTE.split('/')[1], <LoginPage />),
  ...generateRoutePair(AppRoutes.CONTINUE_INVITE_ROUTE.split('/')[1], <ContinueInvitePage isFullScreen />),

  // fallback route
  { path: '*', element: <Error404Page /> },
];

// routes only available in standalone build
if (!isSaasBuild) {
  routes.push({ path: AppRoutes.SIGNUP_ROUTE, element: <SignupPage /> });
}

const router = createBrowserRouter(routes);

export { router };
