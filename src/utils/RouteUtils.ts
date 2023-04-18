import { Network } from '@/models/Network';
import { useLocation } from 'react-router-dom';
import { Host } from '../models/Host';
import { AppRoutes } from '../routes';
import { AMUI_URL } from '@/services/BaseService';
import { useStore } from '@/store/store';

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
export function getAmuiUrl() {
  return `${AMUI_URL}/dashboard?tenantId=${useStore.getState().tenantId}&sToken=${useStore.getState().amuiAuthToken}`;
}
