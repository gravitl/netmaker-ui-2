import { Interface } from './Interface';
import { Node } from './Node';

export interface Host {
  id: string;
  verbosity: number;
  firewallinuse: string;
  version: string;
  name: string;
  os: string;
  debug: boolean;
  isstatic: boolean;
  isstaticport: boolean;
  listenport: number;
  localrange: string;
  mtu: number;
  interfaces: Interface[];
  defaultinterface: string; // iface name
  endpointip: string;
  endpointipv6: string;
  publickey: string;
  macaddress: string;
  nodes: Node['id'][];
  isdefault: boolean;
  nat_type: 'public' | 'symmetric' | 'asymmetric' | 'double' | '';
  persistentkeepalive: number;
  autoupdate: boolean;
}

export interface HostCommonDetails {
  name: Host['name'];
  version: Host['version'];
  endpointip: Host['endpointip'];
  endpointipv6: Host['endpointipv6'];
  publickey: Host['publickey'];
  os: Host['os'];
  listenport: Host['listenport'];
  isstaticendpoint: Host['isstatic'];
  isstaticport: Host['isstaticport'];
  mtu: Host['mtu'];
  interfaces: Host['interfaces'];
  macaddress: Host['macaddress'];
  firewallinuse: Host['firewallinuse'];
}
