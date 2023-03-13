import { StateCreator } from 'zustand';
import { AvailableThemes } from '../models/AvailableThemes';

export interface IAppSlice {
  currentTheme: AvailableThemes;
  logoUrl: string;
  serverName: string;

  // methods
  setCurrentTheme: (theme: AvailableThemes) => void;
  setLogoUrl: (url: string) => void;
  setServerName: (name: string) => void;
}

const createAppSlice: StateCreator<IAppSlice, [], [], IAppSlice> = (set, get) => ({
  currentTheme: 'dark',
  logoUrl: '',
  serverName: '',

  setCurrentTheme: (theme) => set(() => ({ currentTheme: theme })),
  setLogoUrl: (url) => set(() => ({ logoUrl: url })),
  setServerName: (name) => set(() => ({ serverName: name })),
});

export const AppSlice = {
  createAppSlice,
};
