import { StateCreator } from 'zustand';
import { AvailableThemes } from '../models/AvailableThemes';

export interface IAppSlice {
  currentTheme: AvailableThemes;
  setCurrentTheme: (theme: AvailableThemes) => void;
}

const createAppSlice: StateCreator<IAppSlice, [], [], IAppSlice> = (set, get) => ({
  currentTheme: 'dark',
  setCurrentTheme: (theme) => set(() => ({ currentTheme: theme })),
});

export const AppSlice = {
  createAppSlice,
};
