import { NetworksService } from '@/services/NetworksService';
import { StateCreator } from 'zustand';
import { Network } from '../models/Network';

export interface INetworkSlice {
  // state
  networks: Network[];
  loadingNetworks: boolean;

  // actions
  fetchNetworks: () => Promise<void>;
  setNetworks: (networks: Network[]) => void;
  addNetwork: (network: Network) => void;
  removeNetwork: (networkId: Network['netid']) => void;
  updateNetwork: (networkId: Network['netid'], newNetwork: Network) => void;
  deleteNetwork: (networkId: Network['netid']) => void;
}

const createNetworkSlice: StateCreator<INetworkSlice, [], [], INetworkSlice> = (set, get) => ({
  networks: [],
  loadingNetworks: false,

  async fetchNetworks() {
    try {
      set((state) => ({ loadingNetworks: true }));
      const networks = (await NetworksService.getNetworks()).data;
      set((state) => ({ networks: networks, loadingNetworks: false }));
    } catch (err) {
      console.error(err);
      set((state) => ({ loadingNetworks: false }));
    }
  },
  setNetworks: (networks: Network[]) => set((state) => ({ networks: networks })),
  addNetwork(network) {
    set((state) => ({ networks: [...state.networks, network] }));
  },
  removeNetwork(networkId) {
    set((state) => ({ networks: state.networks.filter((network) => network.netid !== networkId) }));
  },
  updateNetwork(networkId, newNetwork) {
    set((state) => ({
      networks: state.networks.map((network) => {
        if (network.netid === networkId) {
          return newNetwork;
        }
        return network;
      }),
    }));
  },
  deleteNetwork(networkId) {
    set((state) => ({ networks: state.networks.filter((network) => network.netid !== networkId) }));
  },
});

export const NetworkSlice = {
  createNetworkSlice,
};
