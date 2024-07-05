import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppSlice, IAppSlice } from './app';
import { AuthSlice, IAuthSlice } from './auth';
import { HostSlice, IHostSlice } from './hosts';
import { INetworkSlice, NetworkSlice } from './networks';
import { INodeSlice, NodeSlice } from './nodes';
import { INetworksUsecaseSlice, NetworksUsecaseSlice } from './networkusecase';

export const useStore = create<
  INodeSlice & IAppSlice & INetworkSlice & IAuthSlice & IHostSlice & INetworksUsecaseSlice
>()(
  devtools((...a) => ({
    ...NodeSlice.createNodeSlice(...a),
    ...AppSlice.createAppSlice(...a),
    ...AuthSlice.createAuthSlice(...a),
    ...NetworkSlice.createNetworkSlice(...a),
    ...HostSlice.createHostSlice(...a),
    ...NetworksUsecaseSlice.createNetworkUsecaseSlice(...a),
  })),
);

export const BrowserStore = {
  hasNmuiVersionSynced: (): boolean => {
    return window.sessionStorage.getItem('hasNmuiVersionSynced') === 'true';
  },
  syncNmuiVersion: () => {
    window.sessionStorage.setItem('hasNmuiVersionSynced', 'true');
  },
};
