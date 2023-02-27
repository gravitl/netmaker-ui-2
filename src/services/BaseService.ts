import axios from 'axios';
import { TenantConfig } from '../models/ServerConfig';

// function to resolve the particular SaaS tenant's backend URL, ...
export function getTenantConfig(): TenantConfig {
  const isSaasBuild = process.env.REACT_IS_SAAS_BUILD?.toLocaleLowerCase() === 'true';

  if (!isSaasBuild) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      baseUrl: process.env.REACT_BASE_URL!,
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
