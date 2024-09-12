import { Network } from '@/models/Network';
import { useLocation } from 'react-router-dom';
import { Host } from '../models/Host';
import { AppRoutes } from '../routes';
import { AMUI_URL } from '@/services/BaseService';
import { useStore } from '@/store/store';
import { AvailableArchs, AvailableOses } from '@/models/AvailableOses';
import { BUG_REPORT_URL } from '@/constants/AppConstants';
import { ServerConfigService } from '@/services/ServerConfigService';
import { UserGroup, UserRole } from '@/models/User';

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
export function resolveAppRoute(route: string, ...queryParams: { [key: string]: string }[]) {
  if (isCurrentRouteVersioned()) {
    const ret = `/${ServerConfigService.getUiVersion()}${route}?${queryParams
      .map((param) => `${Object.keys(param)[0]}=${encodeURIComponent(param[Object.keys(param)[0]])}`)
      .join('&')}`;
    if (ret.endsWith('?')) {
      return ret.slice(0, -1);
    }
    return ret;
  }
  const ret = `${route}?${queryParams
    .map((param) => `${Object.keys(param)[0]}=${encodeURIComponent(param[Object.keys(param)[0]])}`)
    .join('&')}`;
  if (ret.endsWith('?')) {
    return ret.slice(0, -1);
  }
  return ret;
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

// Get network role details route from role obj or ID
export function getNetworkRoleRoute(roleOrId: UserRole | UserRole['id']): string {
  const placeholder = ':roleId';
  if (typeof roleOrId === 'string')
    return `${resolveAppRoute(AppRoutes.NETWORK_ROLE_DETAILS_ROUTE).replace(placeholder, roleOrId)}`;
  return `${resolveAppRoute(AppRoutes.NETWORK_ROLE_DETAILS_ROUTE).replace(placeholder, roleOrId.id)}`;
}

// Get platform access level details route from role obj or ID
export function getPlatformRoleRoute(roleOrId: UserRole | UserRole['id']): string {
  const placeholder = ':roleId';
  if (typeof roleOrId === 'string')
    return `${resolveAppRoute(AppRoutes.PLATFORM_ROLE_DETAILS_ROUTE).replace(placeholder, roleOrId)}`;
  return `${resolveAppRoute(AppRoutes.PLATFORM_ROLE_DETAILS_ROUTE).replace(placeholder, roleOrId.id)}`;
}

// Get user group details route from role obj or ID
export function getUserGroupRoute(groupOrId: UserGroup | UserGroup['id']): string {
  const placeholder = ':groupId';
  if (typeof groupOrId === 'string')
    return `${resolveAppRoute(AppRoutes.USER_GROUP_DETAILS_ROUTE).replace(placeholder, groupOrId)}`;
  return `${resolveAppRoute(AppRoutes.USER_GROUP_DETAILS_ROUTE).replace(placeholder, groupOrId.id)}`;
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

// Function to get AMUI profile route
export function getAmuiProfileUrl() {
  return `${AMUI_URL}/profile`;
}

// Function to get license dashboard route
export function getLicenseDashboardUrl() {
  return import.meta.env.VITE_LICENSE_DASHBOARD_URL;
}

// Function to get Netmaker support email
export function getNetmakerSupportEmail() {
  return import.meta.env.VITE_NETMAKER_SUPPORT_EMAIL;
}

// Function to get Netmaker trial period docs
export function getNetmakerTrialPeriodDocs() {
  return import.meta.env.VITE_NETMAKER_TRIAL_PERIOD_DOCS_URL;
}

// Function to get PostHog public API key
export function getPostHogPublicApiKey() {
  return (window as any).NMUI_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
}

// Function to get PostHog host
export function getPostHogHost() {
  return (window as any).NMUI_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
}

// Function to get netclient download link and filename based on OS, arch and type
export function getNetclientDownloadLink(os: AvailableOses, arch: AvailableArchs): [string, string] {
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

  effectiveFileName += `-${platform}-${arch}`;

  if (platform === 'windows') effectiveFileName = 'netclientbundle.exe';
  else if (platform === 'darwin') {
    if (arch === 'amd64') effectiveFileName = 'Netclient-Intel.pkg';
    else if (arch === 'arm64') effectiveFileName = 'Netclient-M1.pkg';
  }

  return [
    netclientBinTemplate.replace(verisonPlaceholder, serverVersion).replace(fileNamePlaceholder, effectiveFileName),
    effectiveFileName,
  ];
}

// Function to get rac download link and filename based on OS, arch and type
export function getRACDownloadLink(os: AvailableOses, arch: AvailableArchs): [string, string] {
  const fileNamePlaceholder = ':fileName';
  const verisonPlaceholder = ':version';
  const netclientBinTemplate: string | undefined = import.meta.env.VITE_NETCLIENT_BIN_URL_TEMPLATE;

  if (!netclientBinTemplate) {
    console.error('NETCLIENT TEMPLATE is not defined. Contact your server admin');
    return ['about:blank', ''];
  }

  const platform = os === 'macos' ? 'darwin' : os;
  const serverVersion = useStore.getState().serverConfig?.Version ?? '';
  let effectiveFileName = 'remote-client';

  if (!serverVersion) return ['about:blank', ''];

  effectiveFileName += `-${platform}-${arch}`;

  if (platform === 'windows') effectiveFileName = 'remoteclientbundle.exe';
  else if (platform === 'darwin') {
    if (arch === 'amd64') effectiveFileName = 'remote-access-client-Intel.pkg';
    else if (arch === 'arm64') effectiveFileName = 'remote-access-client-M1.pkg';
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
    BUG_REPORT_URL.replace(':body', `Describe what happened...%0A%0A Error log: %0A\`${encodeURIComponent(body)}\``),
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

/**
 * Get the frontend URL NMUI runs on
 *
 * @returns the frontend URL NMUI runs on
 */
export function getNetmakerUiHost() {
  return window?.location?.host || '';
}
