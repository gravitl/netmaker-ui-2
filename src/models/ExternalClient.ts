import { Node } from './Node';

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
}

export type ExtClientAcls = Record<Node['id'] | ExternalClient['clientid'], never>;
