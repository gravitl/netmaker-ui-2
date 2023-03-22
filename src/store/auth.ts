import { StateCreator } from 'zustand';
import { TenantConfig } from '../models/ServerConfig';

export interface IAuthSlice {
  jwt: TenantConfig['jwt'];
  email: TenantConfig['email'];
  username: TenantConfig['username'];
  tenantId: TenantConfig['tenantId'];

  // methods
  isLoggedIn: () => boolean;
  setStore: (config: Partial<TenantConfig>) => void;
  logout: () => void;
}

const createAuthSlice: StateCreator<IAuthSlice, [], [], IAuthSlice> = (set, get) => ({
  jwt: '',
  email: '',
  tenantId: '',
  username: '',

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
    });
  },
});

export const AuthSlice = {
  createAuthSlice,
};
