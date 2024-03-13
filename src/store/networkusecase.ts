import { StateCreator } from 'zustand';
import { Network } from '../models/Network';

export type NetworkUsecaseString = 'remote_access_multiple_users' | 'egress_to_cloud_vpc' | 'egress_to_office_lan_ips';

interface NetworksUsecase {
  [key: Network['netid']]: NetworkUsecaseString;
}

export interface INetworksUsecaseSlice {
  networksUsecase: NetworksUsecase;
  setNetworksUsecase: (networks: NetworksUsecase) => void;
  updateNetworkUsecase: (networkId: Network['netid'], newNetworkUsecase: NetworkUsecaseString) => void;
  deleteNetworkUsecase: (networkId: Network['netid']) => void;
}

const createNetworkUsecaseSlice: StateCreator<INetworksUsecaseSlice, [], [], INetworksUsecaseSlice> = (set) => ({
  networksUsecase: {},
  setNetworksUsecase: (networksUsecase: NetworksUsecase) => set(() => ({ networksUsecase })),
  updateNetworkUsecase(networkId, newNetworkUsecase) {
    set((state) => ({
      networksUsecase: {
        ...state.networksUsecase,
        [networkId]: newNetworkUsecase,
      },
    }));
  },
  deleteNetworkUsecase(networkId) {
    set((state) => ({
      networksUsecase: Object.keys(state.networksUsecase).reduce((acc, key) => {
        if (key !== networkId) {
          acc[key] = state.networksUsecase[key];
        }
        return acc;
      }, {} as NetworksUsecase),
    }));
  },
});

export const NetworksUsecaseSlice = {
  createNetworkUsecaseSlice,
};
