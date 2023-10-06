import { Network } from '@/models/Network';
import { useLocation } from 'react-router-dom';
import { Host } from '../models/Host';
import { AppRoutes } from '../routes';
import { AMUI_URL } from '@/services/BaseService';
import { useStore } from '@/store/store';
import { AvailableArchs, AvailableOses } from '@/models/AvailableOses';
import { BUG_REPORT_URL } from '@/constants/AppConstants';
import { ServerConfigService } from '@/services/ServerConfigService';

type AmuiRouteAction = '' | 'upgrade' | 'invite-user';

/**
 * Function to check if the current route is versioned.
 * This is used to determine if React router should navigate with versioned routes
 *
 * @returns true if the current route is versioned
 */
export function isCurrentRouteVersioned() {
  return window.location.pathname.startsWith(`/${ServerConfigService.getUiVersion()}`);
}

/**
 * Function to check and provide a versioned route or not
 *
 * @param route route to resolve
 * @returns the resolved route
 */
export function resolveAppRoute(route: string) {
  if (isCurrentRouteVersioned()) {
    return `/${ServerConfigService.getUiVersion()}${route}`;
  }
  return route;
}

// Get host route from host obj or ID
export function getHostRoute(hostOrId: Host | Host['id'], ...queryParams: { [key: string]: string }[]): string {
  const placeholder = ':hostId';
  let route = '';
  if (typeof hostOrId === 'string') route = `${resolveAppRoute(AppRoutes.HOST_ROUTE).replace(placeholder, hostOrId)}`;
  else route = `${resolveAppRoute(AppRoutes.HOST_ROUTE).replace(placeholder, hostOrId.id)}`;
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
  let route = resolveAppRoute(AppRoutes.NETWORK_HOST_ROUTE);
  if (typeof hostOrId === 'string') route = route.replace(hostPlaceholder, hostOrId);
  else route = route.replace(hostPlaceholder, hostOrId.id);
  if (typeof networkOrId === 'string') route = route.replace(networkPlaceholder, networkOrId);
  else route = route.replace(networkPlaceholder, networkOrId.netid);
  return route;
}

// Get network route from network obj or ID
export function getNetworkRoute(networkOrId: Network | Network['netid']): string {
  const placeholder = ':networkId';
  if (typeof networkOrId === 'string')
    return `${resolveAppRoute(AppRoutes.NETWORK_DETAILS_ROUTE).replace(placeholder, networkOrId)}`;
  return `${resolveAppRoute(AppRoutes.NETWORK_DETAILS_ROUTE).replace(placeholder, networkOrId.netid)}`;
}

// Get new host route
export function getNewHostRoute(redirectTo?: string): string {
  return `${resolveAppRoute(AppRoutes.NEW_HOST_ROUTE)}${
    redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''
  }`;
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

// Function to get AMUI tenants route
export function getAmuiTenantsUrl() {
  return `${AMUI_URL}/tenants`;
}

// Function to get license dashboard route
export function getLicenseDashboardUrl() {
  return import.meta.env.VITE_LICENSE_DASHBOARD_URL;
}

// Function to get Netmaker support email
export function getNetmakerSupportEmail() {
  return import.meta.env.VITE_NETMAKER_SUPPORT_EMAIL;
}

// Function to get netclient download link and filename based on OS, arch and type
export function getNetclientDownloadLink(
  os: AvailableOses,
  arch: AvailableArchs,
  appType: 'gui' | 'cli' = 'gui'
): [string, string] {
  const fileNamePlaceholder = ':fileName';
  const verisonPlaceholder = ':version';
  const netclientBinTemplate: string | undefined = import.meta.env.VITE_NETCLIENT_BIN_URL_TEMPLATE;

  if (!netclientBinTemplate) {
    console.error('NETCLIENT TEMPLATE is not defined. Contact your server admin');
    return ['about:blank', ''];
  }

  const platform = os === 'macos' ? 'darwin' : os;
  const serverVersion = useStore.getState().serverConfig?.Version ?? '';
  let effectiveFileName = 'netclient';

  if (!serverVersion) return ['about:blank', ''];

  if (appType === 'gui') {
    effectiveFileName += '-gui';
  }
  effectiveFileName += `-${platform}-${arch}`;

  if (platform === 'windows') effectiveFileName = 'netclient_x86.msi';
  else if (platform === 'darwin') {
    if (arch === 'amd64') effectiveFileName = 'Netclient-Intel.pkg';
    else if (arch === 'arm64') effectiveFileName = 'Netclient-M1.pkg';
  }

  return [
    netclientBinTemplate.replace(verisonPlaceholder, serverVersion).replace(fileNamePlaceholder, effectiveFileName),
    effectiveFileName,
  ];
}

// Function that returns the current URL without query params
export function deriveUrlWithoutQueryParams(url?: string): string {
  if (!url) {
    return window.location.href.split('?')[0];
  }
  return url.split('?')[0];
}

// Function that truncates query params from the current URL
export function truncateQueryParamsFromCurrentUrl() {
  const nonSensitiveUrl = deriveUrlWithoutQueryParams();
  window.history.replaceState({}, '', nonSensitiveUrl);
}

// Function that opens a URL in a new tab
export function openInNewTab(url: string) {
  const win = window.open(url, '_blank');
  if (win) win.focus();
}

// Function to file a bug report for the UI
export function fileBugReport(body: string) {
  openInNewTab(
    BUG_REPORT_URL.replace(':body', `Describe what happened...%0A%0A Error log: %0A\`${encodeURIComponent(body)}\``)
  );
}

/**
 * Function to reload the UI with a specific version
 *
 * @param uiVersion ui version to load
 */
export function reloadNmuiWithVersion(uiVersion = '') {
  const newUrl = `${window.location.origin}/${uiVersion ? `${uiVersion}/` : ''}`;
  window.location.href = newUrl;
}
