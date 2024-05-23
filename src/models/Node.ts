import { HostCommonDetails } from './Host';

export interface Node {
  id: string;
  hostid: string;
  address: string;
  address6: string;
  localaddress: string;
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
  isinternetgateway: boolean;
  internetgw_node_id: Node['id'];
  inet_node_req: {
    inet_node_client_ids?: Node['id'][];
  };
  defaultacl: string;
  connected: boolean;
  failover: boolean;
  isrelay: boolean;
  isrelayed: boolean;
  relayedby: Node['id'];
  relaynodes?: Node['id'][];
  autoupdate: boolean;
  is_fail_over: boolean;
  failed_over_by: Node['id'];
  fail_over_peers: Node['id'][]; // temporary don't know the type;
  metadata?: string;
  additional_rag_ips: string[];
}

export type AddressType = 'address' | 'address6' | 'localaddress';

export type ExtendedNode = Node & Partial<HostCommonDetails>;
