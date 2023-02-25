import { StateCreator } from 'zustand';
import { TenantConfig } from '../models/ServerConfig';

export interface IAuthSlice {
  jwt: TenantConfig['jwt'];
  email: TenantConfig['email'];
  username: TenantConfig['username'];
  tenantId: TenantConfig['tenantId'];
  isLoggedIn: () => boolean;
  setStore: (config: TenantConfig) => void;
}

const createAuthSlice: StateCreator<IAuthSlice, [], [], IAuthSlice> = (set, get) => ({
  jwt: '',
  isLoggedIn() {
    return !!get().jwt;
  },
  setStore(config) {
    set(config);
  },
  email: '',
  tenantId: '',
  username: '',
});

export const AppSlice = {
  createAppSlice: createAuthSlice,
};
