import { Node, NodeStatus } from './Node';
import { Tag } from './Tags';

export interface ExternalClient {
  clientid: string;
  description: string;
  privatekey: string;
  publickey: string;
  network: string;
  address: string;
  address6: string;
  ingressgatewayid: string;
  ingressgatewayendpoint: string;
  lastmodified: number;
  enabled: boolean;
  ownerid: string;
  internal_ip_addr: string;
  internal_ip_addr6: string;
  dns: string;
  extraallowedips: string[];
  deniednodeacls?: ExtClientAcls;
  postup?: string;
  postdown?: string;
  tags: Record<Tag['id'], null>;
  status: NodeStatus;
}

export type ExtClientAcls = Record<Node['id'] | ExternalClient['clientid'], never>;
