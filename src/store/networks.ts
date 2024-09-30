import { NetworksService } from '@/services/NetworksService';
import { convertNetworkPayloadToUiNetwork } from '@/utils/NetworkUtils';
import { StateCreator } from 'zustand';
import { Network, NetworkStat } from '../models/Network';

export interface INetworkSlice {
  // state
  networks: NetworkStat[];
  isFetchingNetworks: boolean;

  // actions
  fetchNetworks: () => Promise<void>;
  // setNetworks: (networks: Network[]) => void;
  addNetwork: (network: Network) => void;
  removeNetwork: (networkId: Network['netid']) => void;
  // updateNetwork: (networkId: Network['netid'], newNetwork: Network) => void;
  deleteNetwork: (networkId: Network['netid']) => void;
}

const createNetworkSlice: StateCreator<INetworkSlice, [], [], INetworkSlice> = (set, get) => ({
  networks: [],
  isFetchingNetworks: false,

  async fetchNetworks() {
    try {
      set(() => ({ isFetchingNetworks: true }));
      // const nets = (await NetworksService.getNetworksWithStats()).data.Response ?? [];
      const nets = (await NetworksService.getNetworks()).data ?? [];
      set(() => ({
        networks: nets.map((ns) => ({ ...convertNetworkPayloadToUiNetwork(ns), hosts: 0 })),
        isFetchingNetworks: false,
      }));
    } catch (err) {
      console.error(err);
      set(() => ({ isFetchingNetworks: false }));
    }
  },
  // setNetworks: (networks: Network[]) => set(() => ({ networks: networks })),
  addNetwork(network) {
    set((state) => ({ networks: [...state.networks, { ...network, hosts: 0 }] }));
  },
  removeNetwork(networkId) {
    set((state) => ({ networks: state.networks.filter((network) => network.netid !== networkId) }));
  },
  // updateNetwork(networkId, newNetwork) {
  //   set((state) => ({
  //     networks: state.networks.map((network) => {
  //       if (network.netid === networkId) {
  //         return newNetwork;
  //       }
  //       return network;
  //     }),
  //   }));
  // },
  deleteNetwork(networkId) {
    set((state) => ({ networks: state.networks.filter((network) => network.netid !== networkId) }));
  },
});

export const NetworkSlice = {
  createNetworkSlice,
};
