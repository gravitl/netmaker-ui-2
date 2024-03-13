// in this file we set network use cases and minimums for each use case

import { NetworkUsecaseString } from '@/store/networkusecase';

export interface NetworkUsage {
  nodes?: number;
  remoteAccessGateways?: number;
  vpnClients?: number;
  egressGateways?: number;
  externalRanges?: number;
  users?: number;
  relays?: number;
  relayedHosts?: number;
}

type NetworkUsecaseMap = {
  [key in NetworkUsecaseString]: NetworkUsage;
};

const remoteAccessMultipleUsers: NetworkUsage = {
  nodes: 1,
  remoteAccessGateways: 1,
  vpnClients: 1,
  // users: 2,
};

const egressToCloudVPC: NetworkUsage = {
  nodes: 1,
  egressGateways: 1,
  externalRanges: 1,
  users: 0,
};

export const networkUsecaseMap: NetworkUsecaseMap = {
  remote_access_multiple_users: remoteAccessMultipleUsers,
  egress_to_cloud_vpc: egressToCloudVPC,
  egress_to_office_lan_ips: {},
};
