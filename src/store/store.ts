import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppSlice, IAppSlice } from './app';
import { AuthSlice, IAuthSlice } from './auth';
import { HostSlice, IHostSlice } from './hosts';
import { INetworkSlice, NetworkSlice } from './networks';
import { INodeSlice, NodeSlice } from './nodes';

// const useStore = create<ReturnType<typeof NodeSlice.createNodeSlice> & ReturnType<typeof AppSlice.createAppSlice>>(
//   (set, get) => ({
//     ...NodeSlice.createNodeSlice(set, get),
//     ...AppSlice.createAppSlice(set, get),
//   })
// );

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
