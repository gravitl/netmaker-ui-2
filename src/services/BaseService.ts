// import { ApiRoutes } from '@/constants/ApiRoutes';
// import { User } from '@/models/User';
import { useStore } from '@/store/store';
import { truncateQueryParamsFromCurrentUrl } from '@/utils/RouteUtils';
import axios from 'axios';

export const isSaasBuild = import.meta.env.VITE_IS_SAAS_BUILD?.toLocaleLowerCase() === 'true';

export const axiosService = axios.create();

export const AMUI_URL = isSaasBuild ? (window as any).NMUI_AMUI_URL : '';

export const INTERCOM_APP_ID = isSaasBuild ? (window as any).NMUI_INTERCOM_APP_ID : '';

// function to resolve the particular SaaS tenant's backend URL, ...
export async function setupTenantConfig(): Promise<void> {
  if (!isSaasBuild) {
    const dynamicBaseUrl = (window as any).NMUI_BACKEND_URL;
    const resolvedBaseUrl = dynamicBaseUrl ? `${dynamicBaseUrl}/api` : `${import.meta.env.VITE_BASE_URL}/api`;
    useStore.getState().setStore({
      baseUrl: resolvedBaseUrl,
    });
    axiosService.defaults.baseURL = resolvedBaseUrl;
    return;
  }

  const url = new URL(window.location.href);
  const baseUrl = url.searchParams.get('backend');
  const accessToken = url.searchParams.get('token');
  const amuiAuthToken = url.searchParams.get('sToken') ?? '';
  const tenantId = url.searchParams.get('tenantId') ?? '';
  const tenantName = url.searchParams.get('tenantName') ?? '';
  const username = url.searchParams.get('username') ?? '';
  const amuiUserId = url.searchParams.get('userId') ?? '';

  const resolvedBaseUrl = baseUrl
    ? baseUrl?.startsWith('https')
      ? `${baseUrl}/api`
      : `https://${baseUrl}/api`
    : useStore.getState().baseUrl;
  axiosService.defaults.baseURL = resolvedBaseUrl;

  truncateQueryParamsFromCurrentUrl();

  // let user: User | undefined;
  // try {
  //   user = (
  //     await baseService.get(`${ApiRoutes.USERS}/${encodeURIComponent(username)}`, {
  //       headers: { Authorization: `Bearer ${accessToken || useStore.getState().jwt}`, user: username },
  //     })
  //   ).data;
  // } catch (err) {
  //   console.error(err);
  //   alert('Failed to fetch user details: ' + String(err));
  //   return;
  // }

  useStore.getState().setStore({
    baseUrl: resolvedBaseUrl,
    jwt: accessToken || useStore.getState().jwt,
    tenantId: tenantId || useStore.getState().tenantId,
    tenantName: tenantName || useStore.getState().tenantName,
    amuiAuthToken,
    username: username || useStore.getState().username,
    amuiUserId: amuiUserId || useStore.getState().amuiUserId,
    // user,
  });
}

// token interceptor for axios
axiosService.interceptors.request.use((config) => {
  const token = useStore.getState().jwt;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosService.interceptors.response.use(
  (res) => {
    return res;
  },
  (err) => {
    // Check if the error is a 401 response
    if (err.response?.status === 401) {
      useStore.getState().logout();
      // Full redirect the user to the login page or display a message
      window.location.href = '/login';
    }
    // Return the error so it can be handled by the calling code
    return Promise.reject(err);
  },
);
