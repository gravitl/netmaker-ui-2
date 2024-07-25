import { StateCreator } from 'zustand';
import { TenantConfig } from '../models/ServerConfig';
import { User, UserRole } from '@/models/User';
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
  userPlatformRole: UserRole | null;
  isNewTenant: TenantConfig['isNewTenant'];

  // methods
  isLoggedIn: () => boolean;
  setStore: (config: Partial<TenantConfig & { user: User; userPlatformRole: UserRole }>) => void;
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
  userPlatformRole: null,

  isLoggedIn() {
    // TODO: fix username retrieval for SaaS
    return (
      !!get().jwt && isValidJwt(get().jwt || '') && (!isSaasBuild ? !!get().user && !!get().userPlatformRole : true)
    );
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
      userPlatformRole: null,
    });
  },
});

export const AuthSlice = {
  createAuthSlice,
};
