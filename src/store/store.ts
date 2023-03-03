import { create } from 'zustand';
import { AppSlice, IAppSlice } from './app';
import { AuthSlice, IAuthSlice } from './auth';
import { INetworkSlice, NetworkSlice } from './networks';
import { INodeSlice, NodeSlice } from './nodes';

// const useStore = create<ReturnType<typeof NodeSlice.createNodeSlice> & ReturnType<typeof AppSlice.createAppSlice>>(
//   (set, get) => ({
//     ...NodeSlice.createNodeSlice(set, get),
//     ...AppSlice.createAppSlice(set, get),
//   })
// );

export const useStore = create<INodeSlice & IAppSlice & INetworkSlice & IAuthSlice>()((...a) => ({
  ...NodeSlice.createNodeSlice(...a),
  ...AppSlice.createAppSlice(...a),
  ...AuthSlice.createAuthSlice(...a),
  ...NetworkSlice.createNetworkSlice(...a),
}));
