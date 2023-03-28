import { useStore } from '@/store/store';
import axios from 'axios';
import { TenantConfig } from '../models/ServerConfig';

export const isSaasBuild = import.meta.env.VITE_IS_SAAS_BUILD?.toLocaleLowerCase() === 'true';
let apiBaseUrl = '';

// function to resolve the particular SaaS tenant's backend URL, ...
export function getTenantConfig(): TenantConfig {
  if (!isSaasBuild) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    apiBaseUrl = import.meta.env.VITE_BASE_URL!;
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      baseUrl: import.meta.env.VITE_BASE_URL!,
    };
  }

  // TODO: API call
  apiBaseUrl = '';
  return {
    baseUrl: '',
  };

  // TODO: commit config in store
}

const API_PREFIX = '/api';

export const baseService = axios.create({
  baseURL: getTenantConfig().baseUrl + API_PREFIX,
});

// token interceptor for axios
baseService.interceptors.request.use((config) => {
  const token = useStore.getState().jwt;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

baseService.interceptors.response.use(
  (res) => {
    return res;
  },
  (err) => {
    // Check if the error is a 401 response
    if (err.response.status === 401) {
      useStore.getState().logout();
      // Full redirect the user to the login page or display a message
      window.location.href = '/login';
    }
    // Return the error so it can be handled by the calling code
    return Promise.reject(err);
  }
);
