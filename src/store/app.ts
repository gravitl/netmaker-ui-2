import { ServerStatus } from '@/models/ServerConfig';
import { StateCreator } from 'zustand';
import { AvailableThemes } from '../models/AvailableThemes';

export interface IAppSlice {
  currentTheme: AvailableThemes;
  logoUrl: string;
  serverName: string;
  serverStatus: { status: ServerStatus | null; isHealthy: boolean };

  // methods
  setCurrentTheme: (theme: AvailableThemes) => void;
  setLogoUrl: (url: string) => void;
  setServerName: (name: string) => void;
  setServerStatus: (status: ServerStatus) => void;
}

const createAppSlice: StateCreator<IAppSlice, [], [], IAppSlice> = (set, get) => ({
  currentTheme: 'dark',
  logoUrl: '',
  serverName: '',
  serverStatus: { status: null, isHealthy: true },

  setCurrentTheme: (theme) => set(() => ({ currentTheme: theme })),
  setLogoUrl: (url) => set(() => ({ logoUrl: url })),
  setServerName: (name) => set(() => ({ serverName: name })),
  setServerStatus: (status) =>
    set(() => ({
      serverStatus: {
        status,
        isHealthy: status.broker_connected && status.db_connected,
      },
    })),
});

export const AppSlice = {
  createAppSlice,
};
