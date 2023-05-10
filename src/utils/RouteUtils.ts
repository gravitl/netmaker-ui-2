import { Network } from '@/models/Network';
import { useLocation } from 'react-router-dom';
import { Host } from '../models/Host';
import { AppRoutes } from '../routes';
import { AMUI_URL } from '@/services/BaseService';
import { useStore } from '@/store/store';
import { AvailableArchs, AvailableOses } from '@/models/AvailableOses';

type AmuiRouteAction = '' | 'upgrade' | 'invite-user';

// Get host route from host obj or ID
export function getHostRoute(hostOrId: Host | Host['id'], ...queryParams: { [key: string]: string }[]): string {
  const placeholder = ':hostId';
  let route = '';
  if (typeof hostOrId === 'string') route = `${AppRoutes.HOST_ROUTE.replace(placeholder, hostOrId)}`;
  else route = `${AppRoutes.HOST_ROUTE.replace(placeholder, hostOrId.id)}`;
  route += queryParams.reduce((acc, curr) => {
    const key = Object.keys(curr)[0];
    return `${acc}${acc.includes('?') ? '&' : '?'}${key}=${curr[key]}`;
  }, '');
  return route;
}

// Get network host route from host ID and network ID or objects
export function getNetworkHostRoute(hostOrId: Host | Host['id'], networkOrId: Network | Network['netid']): string {
  const networkPlaceholder = ':networkId';
  const hostPlaceholder = ':hostId';
  let route = AppRoutes.NETWORK_HOST_ROUTE;
  if (typeof hostOrId === 'string') route = route.replace(hostPlaceholder, hostOrId);
  else route = route.replace(hostPlaceholder, hostOrId.id);
  if (typeof networkOrId === 'string') route = route.replace(networkPlaceholder, networkOrId);
  else route = route.replace(networkPlaceholder, networkOrId.netid);
  return route;
}

// Get network route from network obj or ID
export function getNetworkRoute(networkOrId: Network | Network['netid']): string {
  const placeholder = ':networkId';
  if (typeof networkOrId === 'string') return `${AppRoutes.NETWORK_DETAILS_ROUTE.replace(placeholder, networkOrId)}`;
  return `${AppRoutes.NETWORK_DETAILS_ROUTE.replace(placeholder, networkOrId.netid)}`;
}

// Get new host route
export function getNewHostRoute(redirectTo?: string): string {
  return `${AppRoutes.NEW_HOST_ROUTE}${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
}

// Custom hook to use query params
export function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Function to get AMUI dashboard route
export function getAmuiUrl(action: AmuiRouteAction = '') {
  return `${AMUI_URL}/dashboard?tenantId=${useStore.getState().tenantId}&sToken=${
    useStore.getState().amuiAuthToken
  }&action=${action}`;
}

// Function to get netclient download link based on OS
export function getNetclientDownloadLink(
  os: AvailableOses,
  arch: AvailableArchs,
  appType: 'gui' | 'cli' = 'gui'
): string {
  const placeholder = ':fileName';
  const netclientWindowsTemplate: string = import.meta.env.VITE_NETCLIENT_WINDOWS_DOWNLOAD_URL;
  const netclientMacTemplate: string = import.meta.env.VITE_NETCLIENT_MAC_DOWNLOAD_URL;

  const serverVersion = useStore.getState().serverConfig?.Version ?? '';

  if (!serverVersion) return 'about:blank';

  switch (os) {
    default:
      return 'about:blank';
    case 'windows':
      // TODO: get correct url based on server version
      return netclientWindowsTemplate.replace(placeholder, 'netclient_x86.msi');
    case 'macos':
      // TODO: get correct url based on server version
      return netclientMacTemplate.replace(placeholder, 'Netclient.pkg');
  }
}
