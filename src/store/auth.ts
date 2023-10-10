import { StateCreator } from 'zustand';
import { TenantConfig } from '../models/ServerConfig';
import { User } from '@/models/User';
import { isSaasBuild } from '@/services/BaseService';
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

  isLoggedIn() {
    // TODO: fix username retrieval for SaaS
    return !!get().jwt && isValidJwt(get().jwt || '') && (!isSaasBuild ? !!get().user : true);
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
  },
});

export const AuthSlice = {
  createAuthSlice,
};
