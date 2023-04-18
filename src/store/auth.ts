import { StateCreator } from 'zustand';
import { TenantConfig } from '../models/ServerConfig';

export interface IAuthSlice {
  jwt: TenantConfig['jwt'];
  email: TenantConfig['email'];
  username: TenantConfig['username'];
  tenantId: TenantConfig['tenantId'];
  tenantName: TenantConfig['tenantName'];
  baseUrl: TenantConfig['baseUrl'];
  amuiAuthToken: TenantConfig['amuiAuthToken'];

  // methods
  isLoggedIn: () => boolean;
  setStore: (config: Partial<TenantConfig>) => void;
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

  isLoggedIn() {
    return !!get().jwt;
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
      baseUrl: '',
      amuiAuthToken: '',
    });
  },
});

export const AuthSlice = {
  createAuthSlice,
};
