import { Host, HostCommonDetails } from '@/models/Host';
import { HostsService } from '@/services/HostsService';
import { StateCreator } from 'zustand';

export interface IHostSlice {
  hosts: Host[];
  hostsCommonDetails: Record<Host['id'], HostCommonDetails>;
  isFetchingHosts: boolean;
  setHosts: (hosts: Host[]) => void;
  updateHost: (nodeId: Host['id'], newHost: Host) => void;
  deleteHost: (hostId: Host['id']) => void;
  fetchHosts: () => Promise<void>;
}

const createHostSlice: StateCreator<IHostSlice, [], [], IHostSlice> = (set, get) => ({
  hosts: [],
  hostsCommonDetails: {},
  isFetchingHosts: false,
  setHosts: (hosts: Host[]) => set((state) => ({ hosts: hosts })),
  updateHost(hostId, newHost) {
    set((state) => ({
      hosts: state.hosts.map((host) => {
        if (host.id === hostId) {
          return newHost;
        }
        return host;
      }),
    }));
  },
  deleteHost(hostId) {
    set((state) => ({ hosts: state.hosts.filter((host) => host.id !== hostId) }));
  },
  async fetchHosts() {
    try {
      set((state) => ({ isFetchingHosts: true }));
      const hosts = (await HostsService.getHosts()).data;
      const commonDetails: Record<Host['id'], HostCommonDetails> = {};
      hosts.forEach((host) => {
        commonDetails[host.id] = {
          name: host.name,
          version: host.version,
          endpointip: host.endpointip,
          os: host.os,
          publickey: host.publickey,
          listenport: host.listenport,
          isstatic: host.isstatic,
          mtu: host.mtu,
          interfaces: host.interfaces,
          isrelay: host.isrelay,
          relay_hosts: host.relay_hosts,
          isrelayed: host.isrelayed,
          macaddress: host.macaddress,
        };
      });
      set((state) => ({ hosts: hosts, hostsCommonDetails: commonDetails, isFetchingHosts: false }));
    } catch (err) {
      console.error(err);
      set((state) => ({ isFetchingHosts: false }));
    }
  },
});

export const HostSlice = {
  createHostSlice,
};
