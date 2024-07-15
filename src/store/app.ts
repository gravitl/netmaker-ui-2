import { ServerConfig, ServerStatus } from '@/models/ServerConfig';
import { StateCreator } from 'zustand';
import { AvailableThemes } from '../models/AvailableThemes';
import { ServerConfigService } from '@/services/ServerConfigService';
import { SIDE_NAV_EXPANDED_WIDTH } from '@/layouts/MainLayout';

export interface IAppSlice {
  currentTheme: AvailableThemes;
  logoUrl: string;
  serverName: string;
  serverStatus: { status: ServerStatus | null; isHealthy: boolean };
  serverConfig: ServerConfig | null;
  isSidebarCollapsed: boolean;
  sidebarWidth: string;

  // methods
  setCurrentTheme: (theme: AvailableThemes) => void;
  setLogoUrl: (url: string) => void;
  setServerName: (name: string) => void;
  setServerStatus: (status: ServerStatus) => void;
  fetchServerConfig: () => Promise<[Boolean, ServerConfig | null]>; // eslint-disable-line @typescript-eslint/ban-types
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  setSidebarWidth: (width: string) => void;
}

const createAppSlice: StateCreator<IAppSlice, [], [], IAppSlice> = (set) => ({
  currentTheme: 'dark',
  logoUrl: '',
  serverName: '',
  serverStatus: { status: null, isHealthy: true },
  serverConfig: null,
  isSidebarCollapsed: false,
  sidebarWidth: SIDE_NAV_EXPANDED_WIDTH,

  setCurrentTheme: (theme) => set(() => ({ currentTheme: theme })),
  setLogoUrl: (url) => set(() => ({ logoUrl: url })),
  setServerName: (name) => set(() => ({ serverName: name })),
  setServerStatus: (status) =>
    set(() => ({
      serverStatus: {
        status,
        isHealthy: status.db_connected && status.healthyNetwork && !status.license_error, // not checking broker status here because of mq fallback mechanism between netmaker and netclient
      },
    })),
  fetchServerConfig: async () => {
    try {
      const serverConfig = (await ServerConfigService.getServerConfig()).data;
      set(() => ({ serverConfig }));
      return Promise.resolve([true, serverConfig]);
    } catch (err) {
      console.error(err);
      return Promise.reject([false, null]);
    }
  },
  setIsSidebarCollapsed: (isCollapsed) => set(() => ({ isSidebarCollapsed: isCollapsed })),
  setSidebarWidth: (width) => set(() => ({ sidebarWidth: width })),
});

export const AppSlice = {
  createAppSlice,
};
