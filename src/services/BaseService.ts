import { useStore } from '@/store/store';
import axios from 'axios';
import { TenantConfig } from '../models/ServerConfig';

export const isSaasBuild = import.meta.env.VITE_IS_SAAS_BUILD?.toLocaleLowerCase() === 'true';

// function to resolve the particular SaaS tenant's backend URL, ...
export function getTenantConfig(): TenantConfig {
  if (!isSaasBuild) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      baseUrl: import.meta.env.VITE_BASE_URL!,
    };
  }

  // TODO: API call
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

  console.log(token);

  return config;
});
