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
  locallistenport: number;
  proxy_listen_port: number;
  mtu: number;
  interfaces: Interface[];
  defaultinterface: string; // iface name
  endpointip: string;
  publickey: string;
  macaddress: string;
  internetgateway: string;
  nodes: Node['id'][];
  proxy_enabled: boolean;
  isdefault: boolean;
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
