import { HostCommonDetails } from './Host';

export interface Node {
  id: string;
  hostid: string;
  address: string;
  address6: string;
  localaddress: string;
  persistentkeepalive: number;
  interface: string;
  macaddress: string;
  lastmodified: number;
  expdatetime: number;
  lastcheckin: number;
  lastpeerupdate: number;
  network: string;
  networkrange: string;
  networkrange6: string;
  pendingdelete: boolean;
  isegressgateway: boolean;
  isingressgateway: boolean;
  ingressdns: string;
  egressgatewayranges: string[];
  egressgatewaynatenabled: boolean;
  failovernode: string;
  dnson: boolean;
  islocal: boolean;
  server: string;
  internetgateway: string;
  defaultacl: string;
  connected: boolean;
  failover: boolean;
  relayedby: Node['id'];
  relaynodes?: Node['id'][];
}

export type ExtendedNode = Node & Partial<HostCommonDetails>;
