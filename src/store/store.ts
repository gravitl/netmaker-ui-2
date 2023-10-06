import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppSlice, IAppSlice } from './app';
import { AuthSlice, IAuthSlice } from './auth';
import { HostSlice, IHostSlice } from './hosts';
import { INetworkSlice, NetworkSlice } from './networks';
import { INodeSlice, NodeSlice } from './nodes';

export const useStore = create<INodeSlice & IAppSlice & INetworkSlice & IAuthSlice & IHostSlice>()(
  devtools(
    persist(
      (...a) => ({
        ...NodeSlice.createNodeSlice(...a),
        ...AppSlice.createAppSlice(...a),
        ...AuthSlice.createAuthSlice(...a),
        ...NetworkSlice.createNetworkSlice(...a),
        ...HostSlice.createHostSlice(...a),
      }),
      {
        name: 'netmaker-storage',
      },
    ),
  ),
);

export const BrowserStore = {
  hasNmuiVersionSynced: (): boolean => {
    return window.sessionStorage.getItem('hasNmuiVersionSynced') === 'true';
  },
  syncNmuiVersion: () => {
    window.sessionStorage.setItem('hasNmuiVersionSynced', 'true');
  },
};
