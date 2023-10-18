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
  listenport: number;
  localrange: string;
  mtu: number;
  interfaces: Interface[];
  defaultinterface: string; // iface name
  endpointip: string;
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
  publickey: Host['publickey'];
  os: Host['os'];
  listenport: Host['listenport'];
  isstatic: Host['isstatic'];
  mtu: Host['mtu'];
  interfaces: Host['interfaces'];
  macaddress: Host['macaddress'];
}
