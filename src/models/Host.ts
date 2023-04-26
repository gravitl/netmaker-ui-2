import { Interface } from './Interface';

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
  nodes: string[]; // node ids
  proxy_enabled: boolean;
  isdefault: boolean;
  isrelayed: boolean;
  relayed_by: string; // host id
  isrelay: boolean;
  relay_hosts: string[]; // host ids
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
  isrelay: Host['isrelay'];
  relay_hosts: Host['relay_hosts'];
  isrelayed: Host['isrelayed'];
  macaddress: Host['macaddress'];
}
