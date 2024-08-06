import { StateCreator } from 'zustand';
import { TenantConfig } from '../models/ServerConfig';
import { User } from '@/models/User';
import {
  NMUI_ACCESS_TOKEN_LOCALSTORAGE_KEY,
  NMUI_AMUI_USER_ID_LOCALSTORAGE_KEY,
  NMUI_BASE_URL_LOCALSTORAGE_KEY,
  NMUI_TENANT_ID_LOCALSTORAGE_KEY,
  NMUI_TENANT_NAME_LOCALSTORAGE_KEY,
  NMUI_USERNAME_LOCALSTORAGE_KEY,
  NMUI_USER_LOCALSTORAGE_KEY,
  isSaasBuild,
} from '@/services/BaseService';
import { isValidJwt } from '@/utils/Utils';

export interface IAuthSlice {
  jwt: TenantConfig['jwt'];
  email: TenantConfig['email'];
  username: TenantConfig['username'];
  tenantId: TenantConfig['tenantId'];
  tenantName: TenantConfig['tenantName'];
  baseUrl: TenantConfig['baseUrl'];
  amuiAuthToken: TenantConfig['amuiAuthToken'];
  amuiUserId: TenantConfig['amuiUserId'];
  user: User | null;
  isNewTenant: TenantConfig['isNewTenant'];

  // methods
  isLoggedIn: () => boolean;
  setStore: (config: Partial<TenantConfig & { user: User }>) => void;
  logout: () => void;
}

const createAuthSlice: StateCreator<IAuthSlice, [], [], IAuthSlice> = (set, get) => ({
  jwt: '',
  email: '',
  tenantId: '',
  tenantName: '',
  username: '',
  baseUrl: '',
  amuiAuthToken: '',
  amuiUserId: '',
  user: null,
  isNewTenant: false,

  isLoggedIn() {
    // TODO: fix username retrieval for SaaS
    return !!get().baseUrl && !!get().jwt && isValidJwt(get().jwt || '') && (!isSaasBuild ? !!get().user : true);
  },
  setStore(config) {
    set(config);
  },
  logout() {
    set({
      jwt: '',
      email: '',
      username: '',
      tenantId: '',
      tenantName: '',
      amuiAuthToken: '',
      amuiUserId: '',
      user: null,
    });
    window?.localStorage?.removeItem(NMUI_ACCESS_TOKEN_LOCALSTORAGE_KEY);
    window?.localStorage?.removeItem(NMUI_USERNAME_LOCALSTORAGE_KEY);
    window?.localStorage?.removeItem(NMUI_BASE_URL_LOCALSTORAGE_KEY);
    window?.localStorage?.removeItem(NMUI_TENANT_ID_LOCALSTORAGE_KEY);
    window?.localStorage?.removeItem(NMUI_TENANT_NAME_LOCALSTORAGE_KEY);
    window?.localStorage?.removeItem(NMUI_AMUI_USER_ID_LOCALSTORAGE_KEY);
    window?.localStorage?.removeItem(NMUI_USER_LOCALSTORAGE_KEY);
  },
});

export const AuthSlice = {
  createAuthSlice,
};
