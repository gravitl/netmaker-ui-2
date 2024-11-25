import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
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
import { useStore } from './store/store';
import { useEffect, useState } from 'react';
import { getNetworkPageRoute, getNetworkRoute, resolveAppRoute } from './utils/RouteUtils';
import NetworkNodesPage from './pages/networks/nodes/NetworkNodesPage';
import NetworkRemoteAccessPage from './pages/networks/remote-access/NetworkRemoteAccessPage';
import NetworkRelaysPage from './pages/networks/relays/NetworkRelaysPage';
import NetworkEgressPage from './pages/networks/egress/NetworkEgressPage';
import { NetworkInternetGatewaysPage } from './pages/networks/internet-gateways/InternetGatewaysPage';
import NetworkDnsPage from './pages/networks/dns/NetworkDnsPage';
import NetworkGraphPage from './pages/networks/graph/NetworkGraphPage';
import NetworkMetricsPage from './pages/networks/metrics/NetworkMetricsPage';
import NetworkInfoPage from './pages/networks/info/NetworkInfoPage';
import NetworkAclsPage from './pages/networks/acl/ACLPage';
import NetworkOldAclsPage from './pages/networks/acl-old/OldAclPage';
import { NetworkTagsPage } from './pages/networks/tags/NetworkTagsPage';
import NetworkAnalyticsPage from './pages/networks/analytics/NetworkAnalyticsPage';

export const AppRoutes = {
  INDEX_ROUTE: '/',
  DASHBOARD_ROUTE: '/dashboard',
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
  ROUTE_404: '/404',
  NETWORK_NODES_ROUTE: '/networks/:networkId/nodes',
  NETWORK_REMOTE_ACCESS_ROUTE: '/networks/:networkId/remote-access',
  NETWORK_RELAYS_ROUTE: '/networks/:networkId/relays',
  NETWORK_EGRESS_ROUTE: '/networks/:networkId/egress',
  NETWORK_INTERNET_GATEWAYS_ROUTE: '/networks/:networkId/internet-gateways',
  NETWORK_DNS_ROUTE: '/networks/:networkId/dns',
  NETWORK_GRAPH_ROUTE: '/networks/:networkId/graph',
  NETWORK_METRICS_ROUTE: '/networks/:networkId/metrics',
  NETWORK_INFO_ROUTE: '/networks/:networkId/info',
  NETWORK_ACLS_ROUTE: '/networks/:networkId/acls',
  NETWORK_OLD_ACLS_ROUTE: '/networks/:networkId/old-acls',
  NETWORK_TAGS_ROUTE: '/networks/:networkId/tags',
  NETWORK_ANALYTICS_ROUTE: '/networks/:networkId/analytics',
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

const RedirectToFirstNetwork = () => {
  const store = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        await store.fetchNetworks();
      } catch (error) {
        console.error('Error fetching networks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworks();
  }, []);

  if (isLoading) {
    return null;
  }
  if (store.networks.length > 0) {
    store.setActiveNetwork(store.networks[0].netid);
    return <Navigate to={getNetworkPageRoute('nodes', store.networks[0].netid)} replace />;
  }

  return <Navigate to={resolveAppRoute('/dashboard')} replace />;
};

const routes: RouteObject[] = [
  {
    id: 'main',
    path: AppRoutes.INDEX_ROUTE,
    element: <MainLayout />,
    children: [
      ...generateRoutePair('', <RedirectToFirstNetwork />),
      ...generateRoutePair(
        AppRoutes.DASHBOARD_ROUTE.split('/').slice(1).join('/'),
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
        <Navigate to={`nodes`} replace />, // This will append 'nodes' to the current URL
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
      ...generateRoutePair(
        AppRoutes.NETWORK_NODES_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkNodesPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_REMOTE_ACCESS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkRemoteAccessPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_RELAYS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkRelaysPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_EGRESS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkEgressPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_INTERNET_GATEWAYS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkInternetGatewaysPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_DNS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkDnsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_GRAPH_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkGraphPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_METRICS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkMetricsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_INFO_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkInfoPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_ACLS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkAclsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_OLD_ACLS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkOldAclsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_TAGS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkTagsPage isFullScreen />
        </ProtectedRoute>,
      ),
      ...generateRoutePair(
        AppRoutes.NETWORK_ANALYTICS_ROUTE.split('/').slice(1).join('/'),
        <ProtectedRoute>
          <NetworkAnalyticsPage />
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
